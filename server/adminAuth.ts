import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { storage } from "./storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { getDb } from "./db";
import { adminUsers } from "@shared/schema";
import { eq } from "drizzle-orm";

// Promisify scrypt
const scryptAsync = promisify(scrypt);

// Extend the Session type to include our custom properties
declare module 'express-session' {
  interface SessionData {
    adminAuthenticated?: boolean;
    adminId?: number;
    adminUsername?: string;
  }
}

/**
 * Hash a password using scrypt with a random salt
 * @param password The password to hash
 * @returns A string in the format 'hash.salt'
 */
async function hashPassword(password: string): Promise<string> {
  console.log(`Hashing password with hashPassword function`);
  const salt = randomBytes(16).toString('hex');
  console.log(`Generated salt: ${salt.substring(0, 10)}...`);
  
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  console.log(`Generated hash length: ${derivedKey.toString('hex').length}`);
  
  const hashedResult = `${derivedKey.toString('hex')}.${salt}`;
  console.log(`Final hash format: ${hashedResult.substring(0, 10)}...`);
  return hashedResult;
}

/**
 * Compare a supplied password with a stored hash
 * @param suppliedPassword The password to check
 * @param storedHash The stored password hash in the format 'hash.salt'
 * @returns True if the passwords match, false otherwise
 */
async function comparePasswords(suppliedPassword: string, storedHash: string): Promise<boolean> {
  try {
    console.log(`comparePasswords called with stored hash: ${storedHash.substring(0, 10)}...`);
    
    const [hashedPassword, salt] = storedHash.split('.');
    console.log(`Split result - hashedPassword exists: ${!!hashedPassword}, salt exists: ${!!salt}`);
    
    if (!hashedPassword || !salt) {
      console.log('Invalid hash format, missing hash or salt');
      return false;
    }
    
    console.log(`Salt length: ${salt.length}, Hash length: ${hashedPassword.length}`);
    
    const hashedPasswordBuf = Buffer.from(hashedPassword, 'hex');
    const suppliedPasswordBuf = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;
    
    const result = timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
    console.log(`Password comparison result: ${result}`);
    
    return result;
  } catch (error) {
    console.error('Error comparing passwords:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

// Middleware to check if user is authenticated
export const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  console.log('Auth check - Session exists:', !!req.session);
  console.log('Auth check - Admin authenticated:', req.session?.adminAuthenticated);
  console.log('Auth check - Admin ID:', req.session?.adminId);
  
  if (req.session && req.session.adminAuthenticated) {
    console.log('Admin authenticated successfully, proceeding to next middleware');
    next();
  } else {
    console.log('Admin authentication failed, returning 401');
    res.status(401).json({ error: "Unauthorized" });
  }
};

// Set up admin authentication routes
export function setupAdminAuth(app: Express) {
  // Create a default admin user only if no admin users exist in the database
  async function ensureDefaultAdmin() {
    try {
      // First, check if any admin users exist in the database
      // Use countOnly=true for efficiency, as we only need to know if any users exist
      const adminUsers = await storage.getAllAdminUsers(true);
      
      if (adminUsers.length === 0) {
        // No admin users exist, create the default admin account
        console.log('No admin users found. Creating default admin user...');
        
        // Generate a secure random password
        const crypto = require('crypto');
        const defaultPassword = crypto.randomBytes(12).toString('hex');
        
        const hashedPassword = await hashPassword(defaultPassword);
        await storage.createAdminUser({
          username: 'admin',
          password: hashedPassword
        });
        
        console.log('\n==========================================');
        console.log('🔐 DEFAULT ADMIN ACCOUNT CREATED');
        console.log('==========================================');
        console.log('Username: admin');
        console.log(`Password: ${defaultPassword}`);
        console.log('==========================================');
        console.log('IMPORTANT: Save these credentials securely.');
        console.log('You will need them to log into the admin panel.');
        console.log('This password will not be shown again.');
        console.log('==========================================\n');
      } else {
        // Admin users already exist, no need to create or reset anything
        console.log(`${adminUsers.length} admin users found. Skipping default admin creation.`);
      }
    } catch (error) {
      console.error('Error with admin user setup:', error);
    }
  }
  
  // Ensure default admin exists when server starts
  ensureDefaultAdmin();
  
  // Admin login endpoint with secure password verification
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    
    try {
      // Get the admin by username
      const admin = await storage.getAdminUserByUsername(username);
      
      if (!admin) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      // Verify password
      console.log(`Attempting to verify password for admin: ${username}`);
      console.log(`Password format check: ${admin.password.includes('.') ? 'Hashed format detected' : 'Not in hash.salt format'}`);
      
      const passwordMatches = await comparePasswords(password, admin.password);
      console.log(`Password verification result: ${passwordMatches ? 'Success' : 'Failed'}`);
      
      if (passwordMatches) {
        // Update last login timestamp
        const db = await getDb();
        await db
          .update(adminUsers)
          .set({ lastLogin: new Date() })
          .where(eq(adminUsers.id, admin.id));
        
        // Set session
        req.session.adminAuthenticated = true;
        req.session.adminId = admin.id;
        req.session.adminUsername = admin.username;
        
        // Save session explicitly to ensure it's persisted immediately
        await new Promise<void>((resolve) => {
          req.session.save((err) => {
            if (err) {
              console.error('Error saving session:', err);
            } else {
              console.log('Session saved successfully');
            }
            resolve();
          });
        });
        
        return res.status(200).json({ 
          success: true,
          admin: {
            id: admin.id,
            username: admin.username,
            lastLogin: admin.lastLogin
          }
        });
      } else {
        return res.status(401).json({ error: "Invalid username or password" });
      }
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: "An error occurred during login" });
    }
  });
  
  // Admin logout endpoint
  app.post("/api/admin/logout", (req: Request, res: Response) => {
    if (req.session) {
      req.session.adminAuthenticated = false;
      delete req.session.adminId;
      delete req.session.adminUsername;
    }
    
    res.status(200).json({ success: true });
  });
  
  // Check if admin is logged in
  app.get("/api/admin/status", (req: Request, res: Response) => {
    if (req.session && req.session.adminAuthenticated) {
      res.status(200).json({ 
        loggedIn: true,
        admin: {
          id: req.session.adminId,
          username: req.session.adminUsername
        }
      });
    } else {
      res.status(200).json({ loggedIn: false });
    }
  });
  
  // Change admin password with secure hashing
  app.post("/api/admin/change-password", requireAdminAuth, async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.session.adminId;
    
    if (!currentPassword || !newPassword || !adminId) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }
    
    try {
      // Get admin user
      const admin = await storage.getAdminUserById(adminId);
      if (!admin) {
        return res.status(404).json({ error: "Admin user not found" });
      }
      
      // Verify current password
      const passwordMatches = await comparePasswords(currentPassword, admin.password);
      if (!passwordMatches) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword);
      
      // Update password
      await storage.updateAdminUser(adminId, { password: hashedNewPassword });
      
      return res.status(200).json({ success: true, message: "Password updated successfully" });
    } catch (error) {
      console.error('Change password error:', error);
      return res.status(500).json({ error: "An error occurred" });
    }
  });
  
  // Create additional admin user (only existing admins can create new admins)
  app.post("/api/admin/create", requireAdminAuth, async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }
    
    try {
      // Check if username already exists
      const existingAdmin = await storage.getAdminUserByUsername(username);
      if (existingAdmin) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      console.log(`Creating new admin user with hashed password format: ${hashedPassword.includes('.') ? 'Correct' : 'Incorrect'}`);
      console.log(`First 10 chars of hashed password: ${hashedPassword.substring(0, 10)}...`);
      
      // Create new admin
      const newAdmin = await storage.createAdminUser({
        username,
        password: hashedPassword
      });
      
      // Verify the user was created with the correct password format
      const createdUser = await storage.getAdminUserById(newAdmin.id);
      console.log(`Created user password format check: ${createdUser?.password.includes('.') ? 'Correct' : 'Incorrect'}`);
      console.log(`Created user first 10 chars of hashed password: ${createdUser?.password.substring(0, 10)}...`);
      
      return res.status(201).json({
        success: true,
        admin: {
          id: newAdmin.id,
          username: newAdmin.username
        }
      });
    } catch (error) {
      console.error('Create admin error:', error);
      return res.status(500).json({ error: "An error occurred" });
    }
  });
  
  // Get all admin users
  app.get("/api/admin/users", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllAdminUsers();
      
      // Don't send passwords back to the client
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        lastLogin: user.lastLogin,
        lastUpdated: user.lastUpdated
      }));
      
      res.status(200).json({ users: safeUsers });
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Delete admin user
  app.delete("/api/admin/users/:id", requireAdminAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Safety check to prevent locking out of admin panel - ensure at least one admin remains
      // Use countOnly=true for efficiency, as we only need to check the count
      const allAdmins = await storage.getAllAdminUsers(true);
      if (allAdmins.length <= 1) {
        return res.status(400).json({ error: "Cannot delete the last admin account" });
      }
      
      // Check if attempting to delete currently logged-in account
      if (req.session.adminId === id) {
        // Allow but warn the user
        console.warn(`Admin user ${req.session.adminUsername} (ID: ${id}) deleted their own account`);
      }
      
      const success = await storage.deleteAdminUser(id);
      if (success) {
        // If admin deleted their own account, log them out
        if (req.session.adminId === id) {
          req.session.destroy((err) => {
            if (err) console.error("Error destroying session:", err);
          });
        }
        
        res.status(200).json({ message: "Admin user deleted successfully" });
      } else {
        res.status(404).json({ error: "Admin user not found" });
      }
    } catch (error) {
      console.error("Error deleting admin user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}