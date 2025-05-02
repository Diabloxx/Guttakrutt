/**
 * API authentication routes for username/password based authentication
 */
import { Router } from 'express';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { storage } from '../storage';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();
const scryptAsync = promisify(scrypt);

// Helper function to hash password with salt
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Helper function to compare stored hash with provided password
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Login schema
const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

// Registration schema
const registerSchema = insertUserSchema.extend({
  password: z.string().min(8),
  displayName: z.string().min(2).optional(),
});

// Get current user
router.get('/user', (req, res) => {
  // Check if user is authenticated
  if (req.session?.user) {
    // Return user data without sensitive fields
    const { password, accessToken, refreshToken, ...safeUser } = req.session.user;
    return res.json({
      authenticated: true,
      user: safeUser,
    });
  }
  
  // User is not authenticated
  return res.json({
    authenticated: false,
    user: null,
    debug: { headers: req.headers, session: req.session },
  });
});

// Login route
router.post('/login', async (req, res) => {
  try {
    // Validate request body
    const data = loginSchema.parse(req.body);
    
    // Find user by username
    const user = await storage.getUserByUsername(data.username);
    
    // If user not found or password doesn't match
    if (!user || !user.password || !(await comparePasswords(data.password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }
    
    // Store user in session
    req.session.user = user;
    req.session.authenticated = true;
    
    // Update last login time
    await storage.updateUserLastLogin(user.id);
    
    // Return safe user object (excluding sensitive fields)
    const { password, accessToken, refreshToken, ...safeUser } = user;
    
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: safeUser,
    });
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login',
    });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    // Validate request body
    const data = registerSchema.parse(req.body);
    
    // Check if username already exists
    const existingUser = await storage.getUserByUsername(data.username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists',
      });
    }
    
    // Check if email already exists (if provided)
    if (data.email) {
      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email address already in use',
        });
      }
    }
    
    // Hash password
    const hashedPassword = await hashPassword(data.password);
    
    // Create user
    const user = await storage.createUser({
      ...data,
      password: hashedPassword,
    });
    
    // Store user in session
    req.session.user = user;
    req.session.authenticated = true;
    
    // Return safe user object (excluding sensitive fields)
    const { password, accessToken, refreshToken, ...safeUser } = user;
    
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: safeUser,
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred during registration',
    });
  }
});

// Logout route - enhanced for better reliability
router.post('/logout', (req, res) => {
  console.log('API Logout endpoint called');
  
  // First check if req.logout exists (from Passport)
  if (req.logout) {
    req.logout((err) => {
      if (err) {
        console.error('Passport logout error:', err);
        // Continue with session destruction even if Passport logout failed
      }
      
      // Now destroy the session
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error('Session destruction error:', err);
            return res.status(500).json({
              success: false,
              message: 'An error occurred during logout',
            });
          }
          
          // Clear the session cookie and any other auth cookies
          res.clearCookie('connect.sid');
          
          console.log('Logout successful - session destroyed and cookie cleared');
          
          return res.status(200).json({
            success: true,
            message: 'Logged out successfully',
          });
        });
      } else {
        // No session to destroy
        console.log('Logout called with no session to destroy');
        res.clearCookie('connect.sid');
        
        return res.status(200).json({
          success: true,
          message: 'Logged out successfully (no session)',
        });
      }
    });
  } else {
    // If req.logout doesn't exist (unusual but possible in some setups)
    console.log('Logout fallback - req.logout not available');
    
    // Try to destroy the session directly
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          return res.status(500).json({
            success: false,
            message: 'An error occurred during logout',
          });
        }
        
        res.clearCookie('connect.sid');
        return res.status(200).json({
          success: true,
          message: 'Logged out successfully (fallback method)',
        });
      });
    } else {
      // No session or logout method available
      console.log('Logout - no session or logout method available');
      res.clearCookie('connect.sid');
      
      return res.status(200).json({
        success: true, 
        message: 'Logged out successfully (cookie cleared)',
      });
    }
  }
});

// Direct login route (used for Windows SQL auth and legacy systems)
router.post('/direct-login', async (req, res) => {
  try {
    const { token, userId, redirectUrl } = req.body;
    
    if (!token || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }
    
    // Find user by ID
    const user = await storage.getUser(parseInt(userId, 10));
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user ID',
      });
    }
    
    // In a real implementation, verify the token
    // For now, we'll trust the token (simulating the old system)
    
    // Store user in session
    req.session.user = user;
    req.session.authenticated = true;
    
    // Update last login time
    await storage.updateUserLastLogin(user.id);
    
    return res.status(200).json({
      success: true,
      message: 'Direct login successful',
      redirectUrl: redirectUrl || '/',
    });
  } catch (error) {
    console.error('Direct login error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred during direct login',
    });
  }
});

// Connect Battle.net account to existing user account
router.post('/connect-bnet', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session?.user || !req.session.authenticated) {
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to connect a Battle.net account',
      });
    }
    
    const { battleNetId, battleTag, accessToken, refreshToken, tokenExpiry } = req.body;
    
    if (!battleNetId || !battleTag || !accessToken || !refreshToken || !tokenExpiry) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Battle.net account information',
      });
    }
    
    try {
      // Convert tokenExpiry to a Date object if it's a string
      const expiryDate = typeof tokenExpiry === 'string' ? new Date(tokenExpiry) : tokenExpiry;
      
      // Connect the Battle.net account to the user account
      const updatedUser = await storage.connectBattleNetAccount(
        req.session.user.id,
        battleNetId,
        battleTag,
        accessToken,
        refreshToken,
        expiryDate
      );
      
      // Update the session with the updated user data
      if (updatedUser) {
        req.session.user = updatedUser;
        
        // Return success without sensitive information
        const { password, accessToken, refreshToken, ...safeUser } = updatedUser;
        
        return res.status(200).json({
          success: true,
          message: 'Battle.net account connected successfully',
          user: safeUser,
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to connect Battle.net account',
        });
      }
    } catch (connectionError) {
      console.error('Connect Battle.net error:', connectionError);
      
      // Check if the error is due to the Battle.net account already being connected
      if (connectionError.message.includes('already connected')) {
        return res.status(400).json({
          success: false,
          message: connectionError.message,
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'An error occurred while connecting the Battle.net account',
      });
    }
  } catch (error) {
    console.error('Connect Battle.net error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred while connecting the Battle.net account',
    });
  }
});

export default router;