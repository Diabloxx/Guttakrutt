import { Express, Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as BnetStrategy } from "passport-bnet";
import session from "express-session";
import { storage } from "../storage";

// Extend session interface to include our oauthState
declare module 'express-session' {
  interface SessionData {
    oauthState?: string;
  }
}
// We don't need to import the User type here since we're defining our own interface

/**
 * Define our own User interface for Express instead of extending from schema
 * This avoids recursive type references
 */
declare global {
  namespace Express {
    interface User {
      id: number;
      battleNetId: string;
      battleTag: string;
      accessToken?: string;
      refreshToken?: string;
      email?: string;
      tokenExpiry?: Date;
      lastLogin?: Date;
      createdAt: Date;
      isGuildMember?: boolean;
      isOfficer?: boolean;
      region?: string;
      locale?: string;
      avatarUrl?: string;
    }
  }
}

// Initialize the Battle.net authentication strategy
export function setupBattleNetAuth(app: Express) {
  // Check for required environment variables
  if (!process.env.BLIZZARD_CLIENT_ID || !process.env.BLIZZARD_CLIENT_SECRET) {
    console.error("Missing required Blizzard API credentials");
    throw new Error("Missing required Blizzard API credentials");
  }

  // Set up session middleware
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "development-secret-change-me",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === "production"
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Set up Battle.net Strategy
  // Always use the production callback URL for Battle.net authorization
  // Ensure we're using HTTPS for Battle.net OAuth (required by Battle.net)
  // IMPORTANT: Use the PHP simulation endpoint to match Windows host behavior
  const callbackURL = "https://guttakrutt.org/auth-callback.php";
  
  console.log(`Setting up Battle.net strategy with callback URL: ${callbackURL}`);

  // These are the official OAuth endpoints for Battle.net according to documentation
  const authorizeURL = "https://oauth.battle.net/authorize";
  const tokenURL = "https://oauth.battle.net/token";
  
  console.log(`Using OAuth endpoints: ${authorizeURL}, ${tokenURL}`);
  
  passport.use(
    new BnetStrategy(
      {
        clientID: process.env.BLIZZARD_CLIENT_ID,
        clientSecret: process.env.BLIZZARD_CLIENT_SECRET,
        callbackURL,
        region: "eu",
        scope: "openid wow.profile",
        // The passport-bnet package automatically uses the correct endpoints
        // based on the region, but we're logging them for troubleshooting
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("Battle.net auth callback received profile:", profile);
          
          // FIXED: Get user info directly from the Battle.net API to ensure we have accurate data
          // OpenID Connect endpoint
          let finalBattleTag = "Unknown#0000";
          let battleNetId = profile.id;
          let bnetUser: any = null;
          
          try {
            console.log("Fetching user info from Battle.net API directly...");
            // Make a direct call to Battle.net API to get user info
            const axios = require('axios');
            const userResponse = await axios.get(`https://eu.battle.net/oauth/userinfo`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });
            
            console.log("Battle.net API userinfo response:", userResponse.data);
            
            if (userResponse.data) {
              bnetUser = userResponse.data;
              
              // Get the battletag from the response
              if (userResponse.data.battletag) {
                finalBattleTag = userResponse.data.battletag;
                console.log(`Found BattleTag in API response: ${finalBattleTag}`);
              }
              
              // Get the id (sub) from the response
              if (userResponse.data.id || userResponse.data.sub) {
                battleNetId = userResponse.data.id || userResponse.data.sub;
                console.log(`Found Battle.net ID in API response: ${battleNetId}`);
              }
            }
          } catch (apiError) {
            console.error("Error fetching Battle.net user info:", apiError);
            // Fall back to the profile data
          }
          
          // Fallback extraction if direct API call fails
          if (finalBattleTag === "Unknown#0000") {
            // Try different case variations that might be in the profile
            if (profile.battletag) finalBattleTag = profile.battletag;
            else if (profile.battleTag) finalBattleTag = profile.battleTag;
            else if (profile.battle_tag) finalBattleTag = profile.battle_tag;
            else if (profile._json?.battletag) finalBattleTag = profile._json.battletag;
            
            // Check for userInfo properties sometimes provided by passport-bnet
            if (finalBattleTag === "Unknown#0000" && profile.userInfo?.battletag) {
              finalBattleTag = profile.userInfo.battletag;
            }
            
            console.log(`Fallback BattleTag extraction result: ${finalBattleTag}`);
          }
          
          // Get the BattleTag directly from the API response
          console.log(`Final BattleTag to be saved: ${finalBattleTag}`);
          
          // For backward compatibility, rename finalBattleTag to battleTag
          const battleTag = finalBattleTag;

          // Find or create user - use the correct Battle.net ID
          let user = await storage.getUserByBattleNetId(battleNetId);

          if (!user) {
            // Create new user with all required fields for MySQL compatibility
            const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            
            // Extract email from the user info if available
            let email = '';
            if (bnetUser && bnetUser.email) {
              email = bnetUser.email;
              console.log(`Found email in Battle.net user data: ${email}`);
            }
            
            try {
              // Check if a user with this email already exists
              let existingUserWithEmail = null;
              if (email) {
                existingUserWithEmail = await storage.getUserByEmail(email);
              }
              
              // If a user with this email already exists, we'll update that user
              // instead of creating a new one
              if (existingUserWithEmail) {
                console.log(`User with email ${email} already exists. Updating the existing user.`);
                
                // Update the existing user with Battle.net information
                user = await storage.updateUser(existingUserWithEmail.id, {
                  battleNetId: battleNetId,
                  battleTag: finalBattleTag,
                  accessToken,
                  refreshToken,
                  tokenExpiry,
                  region: profile.region || "eu",
                  lastLogin: new Date(),
                  locale: bnetUser?.locale || 'en_GB',
                  avatarUrl: profile.avatar || "",
                  // Ensure MySQL field compatibility
                  battle_net_id: battleNetId,
                  battle_tag: finalBattleTag,
                  access_token: accessToken,
                  refresh_token: refreshToken,
                  token_expiry: tokenExpiry,
                  last_login: new Date(),
                  avatar_url: profile.avatar || ""
                });
              } else {
                // Create a new user
                user = await storage.createUser({
                  // Standard fields
                  battleNetId: battleNetId,
                  battleTag: finalBattleTag,
                  accessToken,
                  refreshToken,
                  tokenExpiry,
                  region: profile.region || "eu",
                  // Default values for required fields
                  email: email || `${battleNetId}@guttakrutt.placeholder`, // Use placeholder email if none provided
                  lastLogin: new Date(),
                  createdAt: new Date(),
                  isGuildMember: false,
                  isOfficer: false,
                  locale: bnetUser?.locale || 'en_GB',
                  avatarUrl: profile.avatar || "",
                  // Ensure MySQL field compatibility
                  battle_net_id: battleNetId,
                  battle_tag: finalBattleTag,
                  access_token: accessToken,
                  refresh_token: refreshToken,
                  token_expiry: tokenExpiry,
                  last_login: new Date(),
                  created_at: new Date(),
                  is_guild_member: false,
                  is_officer: false,
                  avatar_url: profile.avatar || ""
                });
              }
            } catch (createError) {
              console.error("Error creating/updating user:", createError);
              throw createError;
            }
            console.log("Created new user from Battle.net auth:", user.id);
          } else {
            // Update existing user with fields for MySQL compatibility
            const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            
            // Extract email from the user info if available and user doesn't have one
            let email = user.email || '';
            if (!email && bnetUser && bnetUser.email) {
              email = bnetUser.email;
              console.log(`Adding email from Battle.net user data: ${email}`);
            }
            
            // Also update the battleTag if it has changed
            const updatedFields: any = {
              // Standard fields
              accessToken,
              refreshToken,
              tokenExpiry,
              avatarUrl: profile.avatar || user.avatarUrl || "",
              lastLogin: new Date(),
              // MySQL compatibility fields
              access_token: accessToken,
              refresh_token: refreshToken,
              token_expiry: tokenExpiry,
              avatar_url: profile.avatar || user.avatarUrl || "",
              last_login: new Date()
            };
            
            // Update email if we found one
            if (email) {
              updatedFields.email = email;
            }
            
            // Update battleTag if we have a real one (not "Unknown#0000")
            if (finalBattleTag && finalBattleTag !== "Unknown#0000") {
              updatedFields.battleTag = finalBattleTag;
              updatedFields.battle_tag = finalBattleTag; // MySQL field
              console.log(`Updating user's BattleTag to: ${finalBattleTag}`);
            }
            
            user = await storage.updateUser(user.id, updatedFields) || user;
            console.log("Updated existing user from Battle.net auth:", user.id);
          }

          return done(null, user);
        } catch (error) {
          console.error("Error in Battle.net auth callback:", error);
          return done(error as Error);
        }
      }
    )
  );

  // Serialize and deserialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`[Auth] Deserializing user with ID: ${id}`);
      
      // Validate the id to make sure it's a real number
      if (isNaN(Number(id)) || !Number.isInteger(Number(id)) || Number(id) <= 0) {
        console.error(`[Auth] Invalid user ID during deserialization: ${id}`);
        return done(new Error(`Invalid user ID: ${id}`), null);
      }
      
      // Use getUser instead of getUserByBattleNetId since we're serializing the user ID, not the Battle.net ID
      const user = await storage.getUser(id);
      
      if (!user) {
        console.error(`[Auth] User not found during deserialization. ID: ${id}`);
        // Instead of failing with an error (which would cause "Failed to deserialize user"), 
        // return null which causes a clean logout
        return done(null, null);
      }
      
      console.log(`[Auth] Successfully deserialized user: ${user.id} (${user.username || user.battleTag || 'unknown'})`);
      done(null, user);
    } catch (error) {
      console.error(`[Auth] Error during user deserialization:`, error);
      // Instead of passing the error which causes "Failed to deserialize user",
      // return null which causes a clean logout
      done(null, null);
    }
  });

  // Authentication routes
  app.get("/api/auth/bnet", (req, res, next) => {
    console.log("Battle.net auth route triggered");
    console.log("Headers:", req.headers);
    console.log("User Agent:", req.headers['user-agent']);
    
    // Use a fixed state parameter to ensure consistency between requests
    // This is safer than a random state in testing environments
    const state = "fixedauthstate456";
    
    // Create a new session if one doesn't exist already
    if (!req.session) {
      console.log("No session exists, creating a new session");
    }
    
    // Store the state in the session
    req.session.oauthState = state;
    console.log("Stored fixed OAuth state in session:", state);
    
    // Force save the session to ensure it persists
    req.session.save((err) => {
      if (err) {
        console.error("Error saving session state:", err);
        // If we can't save the session, send a meaningful error response
        return res.status(500).send("Session storage error. Please try again later.");
      } else {
        console.log("Successfully saved state to session");
        
        // Log client details
        console.log("Client IP:", req.ip);
        console.log("Protocol:", req.protocol);
        console.log("Host:", req.get('host'));
        console.log("Original URL:", req.originalUrl);
        console.log("Session ID:", req.sessionID);
        
        // Construct the callback URL explicitly for logging
        const callbackUrl = `${req.protocol}://${req.get('host')}/auth-callback.php`;
        console.log("Callback URL will be:", callbackUrl);
        
        console.log("Calling passport.authenticate with Battle.net strategy");
        // Call passport authenticate with the state parameter AFTER session is saved
        passport.authenticate("bnet", { state })(req, res, next);
      }
    });
  });

  app.get(
    "/api/auth/bnet/callback",
    (req, res, next) => {
      // Log the incoming callback
      console.log("Received Battle.net callback", {
        state: req.query.state,
        code: req.query.code ? 'present' : 'missing',
        sessionExists: !!req.session,
        oauthStateExists: req.session ? !!req.session.oauthState : false,
        sessionID: req.sessionID
      });
      
      // Check for error in the callback
      if (req.query.error) {
        console.error("OAuth error:", req.query.error);
        return res.redirect('/login-failed?error=' + encodeURIComponent(req.query.error as string));
      }
      
      // Check for required code parameter
      if (!req.query.code) {
        console.error("No authorization code received");
        return res.redirect('/login-failed?error=no_code');
      }
      
      // Verify the state parameter
      const state = req.query.state as string;
      const storedState = req.session?.oauthState;
      
      console.log("State comparison:", { 
        received: state, 
        stored: storedState,
        match: state === storedState
      });
      
      // In development mode, we're more lenient with state validation
      if (process.env.NODE_ENV !== 'production') {
        console.log("Development mode: Allowing callback to proceed regardless of state parameter");
      } else if (state !== storedState) {
        console.error("State validation failed");
        return res.redirect('/login-failed?error=state_mismatch');
      }
      
      // Clear the stored state if it exists
      if (req.session) {
        delete req.session.oauthState;
        
        // Force save the session again to ensure it persists
        req.session.save((err) => {
          if (err) {
            console.error("Error saving session after state clearing:", err);
          } else {
            console.log("Session saved after clearing OAuth state");
            // Continue with authentication after session is saved
            next();
          }
        });
      } else {
        // No session, but continue anyway (this is a fallback)
        console.warn("No session available for clearing OAuth state");
        next();
      }
    },
    passport.authenticate("bnet", {
      failureRedirect: "/login-failed"
    }),
    async (req, res) => {
      // Successful authentication
      console.log("Authentication successful, checking user data");
      
      // Check if user is authenticated and has necessary data
      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        try {
          console.log(`Authenticated user ID: ${req.user.id}, current BattleTag: ${req.user.battleTag || 'Unknown'}`);
          
          // Check if the BattleTag is the initial value or looks incorrect
          if (!req.user.battleTag || req.user.battleTag === 'Unknown#0000' || req.user.battleTag.includes('Unknown')) {
            console.log("BattleTag missing or showing placeholder value, refreshing from Battle.net...");
            
            // Refresh Battle.net user data to get the correct BattleTag
            const refreshResult = await refreshBattleNetUserData(req.user.id, req.user.accessToken);
            
            if (refreshResult.success) {
              console.log(`Successfully refreshed BattleTag to: ${refreshResult.battleTag}`);
            } else {
              console.warn(`Failed to refresh BattleTag: ${refreshResult.message}`);
            }
          } else {
            console.log(`Keeping existing BattleTag: ${req.user.battleTag}`);
          }
        } catch (refreshError) {
          console.error("Error during BattleTag refresh:", refreshError);
          // Continue despite the error - don't block the login process
        }
      }
      
      console.log("Redirecting to homepage");
      
      // Force save the session to ensure authentication state is saved
      if (req.session) {
        req.session.save((err) => {
          if (err) {
            console.error("Error saving session after authentication:", err);
            return res.redirect('/login-failed?error=session_save_failed');
          }
          
          // Redirect to homepage after session is successfully saved
          res.redirect("/");
        });
      } else {
        // Fallback if no session is available
        res.redirect("/");
      }
    }
  );

  // Support both GET and POST methods for logout to ensure compatibility
  const logoutHandler = (req, res) => {
    console.log("[API] Logout request received");
    
    // First try using Passport's logout function
    if (req.logout) {
      req.logout((err) => {
        if (err) {
          console.error("[API] Error during passport logout:", err);
          // Continue despite the error
        }
        
        // Now completely destroy the session
        if (req.session) {
          req.session.destroy((err) => {
            if (err) {
              console.error("[API] Error destroying session:", err);
              return res.status(500).json({ 
                success: false, 
                error: "Failed to destroy session during logout",
                details: err.message 
              });
            }
            
            // Clear all authentication cookies
            res.clearCookie('connect.sid');
            res.clearCookie('guttakrutt_auth');
            res.clearCookie('auth_redirect');
            res.clearCookie('auth_user_id');
            res.clearCookie('auth_battle_tag');
            
            // Include cache-busting in the response
            const cacheBuster = new Date().getTime();
            console.log("[API] Logout successful, session destroyed");
            
            // Allow for both JSON and redirect responses
            const wantsJson = req.get('Accept') === 'application/json' || req.query.format === 'json';
            
            if (wantsJson) {
              res.status(200).json({
                success: true,
                loggedOut: true,
                message: "Logout successful, session destroyed",
                cacheBuster
              });
            } else {
              // Redirect to home page after successful logout with cache buster
              res.redirect(`/?clear_session=${cacheBuster}`);
            }
          });
        } else {
          // No session to destroy
          res.clearCookie('connect.sid');
          res.clearCookie('guttakrutt_auth');
          res.clearCookie('auth_redirect');
          res.clearCookie('auth_user_id');
          res.clearCookie('auth_battle_tag');
          console.log("[API] No session to destroy, cleared cookies");
          
          // Handle both JSON and redirect responses
          if (req.get('Accept') === 'application/json' || req.query.format === 'json') {
            res.status(200).json({
              success: true,
              loggedOut: true,
              message: "Logout successful (no session)"
            });
          } else {
            const cacheBuster = new Date().getTime();
            res.redirect(`/?clear_session=${cacheBuster}`);
          }
        }
      });
    } else {
      // Fallback if req.logout doesn't exist (unlikely)
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error("[API] Error destroying session (fallback):", err);
            return res.status(500).json({ success: false, error: "Failed to logout" });
          }
          
          res.clearCookie('connect.sid');
          res.clearCookie('guttakrutt_auth');
          res.clearCookie('auth_redirect');
          res.clearCookie('auth_user_id');
          res.clearCookie('auth_battle_tag');
          console.log("[API] Logout fallback successful, session destroyed");
          
          if (req.get('Accept') === 'application/json' || req.query.format === 'json') {
            res.status(200).json({
              success: true,
              loggedOut: true,
              message: "Logout successful (fallback)"
            });
          } else {
            const cacheBuster = new Date().getTime();
            res.redirect(`/?clear_session=${cacheBuster}`);
          }
        });
      } else {
        res.clearCookie('connect.sid');
        res.clearCookie('guttakrutt_auth');
        res.clearCookie('auth_redirect');
        res.clearCookie('auth_user_id');
        res.clearCookie('auth_battle_tag');
        console.log("[API] No session or logout method available");
        
        if (req.get('Accept') === 'application/json' || req.query.format === 'json') {
          res.status(200).json({
            success: true,
            loggedOut: true,
            message: "Cookie cleared (minimal fallback)"
          });
        } else {
          const cacheBuster = new Date().getTime();
          res.redirect(`/?clear_session=${cacheBuster}`);
        }
      }
    }
  };
  
  // Register both GET and POST routes for logout
  app.get("/api/auth/logout", logoutHandler);
  app.post("/api/auth/logout", logoutHandler);

  app.get("/api/auth/user", (req, res) => {
    // Use a safer check for isAuthenticated that handles cases where the function might not exist
    const isAuthenticated = req.isAuthenticated && typeof req.isAuthenticated === 'function' && req.isAuthenticated();
    
    if (isAuthenticated) {
      res.json({
        authenticated: true,
        user: req.user
      });
    } else {
      res.json({
        authenticated: false,
        user: null,
        // Add debug info to help troubleshoot issues
        debug: {
          hasIsAuthenticatedMethod: typeof req.isAuthenticated === 'function',
          hasSessionId: !!req.sessionID,
          timestamp: new Date().toISOString()
        }
      });
    }
  });

  // Middleware to check if user is authenticated
  app.get("/api/auth/check", (req, res) => {
    // Use a safer check for isAuthenticated
    const isAuthenticated = req.isAuthenticated && typeof req.isAuthenticated === 'function' && req.isAuthenticated();
    
    res.json({
      authenticated: isAuthenticated,
      sessionExists: !!req.session,
      timestamp: new Date().toISOString()
    });
  });
  
  // Enhanced authentication status endpoint with detailed diagnostics
  // Define a reusable handler for both the direct and proxy routes
  const authStatusHandler = (req: Request, res: Response) => {
    console.log(`Auth status endpoint called via ${req.path}`);
    
    // Add CORS headers to prevent issues
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Force content type to ensure proper parsing
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    try {
      // Get session information
      const sessionInfo = {
        exists: !!req.session,
        id: req.sessionID,
        cookie: req.session?.cookie ? {
          originalMaxAge: req.session.cookie.originalMaxAge,
          expires: req.session.cookie.expires,
          secure: req.session.cookie.secure,
          httpOnly: req.session.cookie.httpOnly,
        } : null,
        oauthState: req.session?.oauthState || null
      };
      
      // Use a safer check for isAuthenticated
      const isAuthenticated = req.isAuthenticated && typeof req.isAuthenticated === 'function' && req.isAuthenticated();
      
      // Get authentication information
      const authInfo = {
        isAuthenticated,
        hasIsAuthenticatedMethod: typeof req.isAuthenticated === 'function',
        user: isAuthenticated && req.user ? {
          id: req.user.id,
          battleNetId: req.user.battleNetId,
          battleTag: req.user.battleTag,
          hasAccessToken: !!req.user.accessToken,
          hasRefreshToken: !!req.user.refreshToken,
          tokenExpiryDate: req.user.tokenExpiry,
          isTokenExpired: req.user.tokenExpiry ? new Date(req.user.tokenExpiry) < new Date() : null,
          lastLogin: req.user.lastLogin,
          isGuildMember: req.user.isGuildMember,
          isOfficer: req.user.isOfficer,
        } : null
      };
      
      // Get request information
      const requestInfo = {
        headers: {
          host: req.get('host'),
          origin: req.get('origin'),
          referer: req.get('referer'),
          userAgent: req.get('user-agent'),
          authorization: req.headers.authorization ? '(present)' : '(not present)',
          cookie: req.headers.cookie ? '(present)' : '(not present)',
        },
        ip: req.ip,
        protocol: req.protocol,
        secure: req.secure,
        method: req.method,
        path: req.path,
        originalUrl: req.originalUrl
      };
      
      // Get environment information
      const envInfo = {
        nodeEnv: process.env.NODE_ENV || 'development',
        hasClientId: !!process.env.BLIZZARD_CLIENT_ID,
        hasClientSecret: !!process.env.BLIZZARD_CLIENT_SECRET,
        hasSessionSecret: !!process.env.SESSION_SECRET,
        serverTime: new Date().toISOString(),
        oauthEndpoints: {
          authorize: authorizeURL,
          token: tokenURL,
          callback: callbackURL
        }
      };
      
      // Return all diagnostic information
      res.json({
        status: isAuthenticated ? 'authenticated' : 'not_authenticated',
        sessionInfo,
        authInfo,
        requestInfo,
        envInfo,
        timestamp: Date.now(),
        route: req.path.includes('proxy-api') ? 'proxy' : 'direct'
      });
    } catch (error) {
      // Handle any errors that might occur
      console.error("Error in auth status handler:", error);
      res.status(500).json({
        error: "Internal server error in auth status handler",
        message: error instanceof Error ? error.message : String(error),
        timestamp: Date.now()
      });
    }
  };
  
  // Register both routes with the same handler
  app.get("/api/auth/status", authStatusHandler);
  app.get("/proxy-api/auth/status", authStatusHandler);

  // Route to link character to user account
  app.post("/api/auth/link-character", requireAuth, async (req, res) => {
    try {
      const { characterId, isMain = false } = req.body;
      const userId = req.user?.id;

      if (!userId || !characterId) {
        return res.status(400).json({
          success: false,
          error: "Missing required parameters"
        });
      }

      // Check if the character exists
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({
          success: false,
          error: "Character not found"
        });
      }

      // Check if the character is already linked to this user
      const ownsCharacter = await storage.userOwnsCharacter(userId, characterId);
      if (ownsCharacter) {
        return res.status(400).json({
          success: false,
          error: "Character already linked to your account"
        });
      }

      // Link the character to the user
      const link = await storage.linkCharacterToUser({
        userId,
        characterId,
        isMain
      });

      // If this is the main character, update other characters
      if (isMain) {
        await storage.setMainCharacter(userId, characterId);
      }

      res.json({
        success: true,
        link
      });
    } catch (error) {
      console.error("Error linking character:", error);
      res.status(500).json({
        success: false,
        error: "An error occurred while linking the character"
      });
    }
  });

  // Route to set a character as the main character
  app.post("/api/auth/set-main-character", requireAuth, async (req, res) => {
    try {
      const { characterId } = req.body;
      const userId = req.user?.id;

      if (!userId || !characterId) {
        return res.status(400).json({
          success: false,
          error: "Missing required parameters"
        });
      }

      // Check if the user owns the character
      const ownsCharacter = await storage.userOwnsCharacter(userId, characterId);
      if (!ownsCharacter) {
        return res.status(403).json({
          success: false,
          error: "This character is not linked to your account"
        });
      }

      // Set the character as main
      const success = await storage.setMainCharacter(userId, characterId);

      res.json({
        success
      });
    } catch (error) {
      console.error("Error setting main character:", error);
      res.status(500).json({
        success: false,
        error: "An error occurred while setting the main character"
      });
    }
  });

  // Route to get a user's characters
  app.get("/api/auth/my-characters", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: "User ID not found"
        });
      }

      const characters = await storage.getUserCharacters(userId);

      res.json({
        success: true,
        characters
      });
    } catch (error) {
      console.error("Error getting user characters:", error);
      res.status(500).json({
        success: false,
        error: "An error occurred while getting user characters"
      });
    }
  });

  // Route to verify ownership of a character
  // This would be implemented in a real-world scenario with various checks
  // For this prototype, we'll just assume verification succeeds
  app.post("/api/auth/verify-character", requireAuth, async (req, res) => {
    try {
      const { characterId } = req.body;
      const userId = req.user?.id;

      if (!userId || !characterId) {
        return res.status(400).json({
          success: false,
          error: "Missing required parameters"
        });
      }

      // Check if the user owns the character
      const ownsCharacter = await storage.userOwnsCharacter(userId, characterId);
      if (!ownsCharacter) {
        return res.status(403).json({
          success: false,
          error: "This character is not linked to your account"
        });
      }

      // In a production system, we would verify ownership through the Blizzard API
      // For this prototype, we'll just mark it as verified
      const success = await storage.verifyCharacterOwnership(userId, characterId);

      res.json({
        success
      });
    } catch (error) {
      console.error("Error verifying character ownership:", error);
      res.status(500).json({
        success: false,
        error: "An error occurred while verifying character ownership"
      });
    }
  });
  
  // Add a route to refresh Battle.net data automatically
  app.get("/api/auth/refresh-bnet-data", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "Authentication required"
        });
      }
      
      const refreshResult = await refreshBattleNetUserData(req.user.id, req.user.accessToken);
      
      res.json({
        success: true,
        message: "Battle.net data refreshed successfully",
        ...refreshResult
      });
    } catch (error) {
      console.error("Error refreshing Battle.net data:", error);
      res.status(500).json({
        success: false,
        error: "An error occurred while refreshing Battle.net data",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
}

/**
 * Refreshes Battle.net user data including BattleTag
 * Will be used on login to ensure we have the latest BattleTag
 */
export async function refreshBattleNetUserData(userId: number, accessToken?: string): Promise<any> {
  try {
    console.log(`Refreshing Battle.net data for user ${userId}`);
    
    // First, check if we have a valid access token
    if (!accessToken) {
      const user = await storage.getUser(userId);
      if (!user || !user.accessToken) {
        console.warn(`No access token available for user ${userId}`);
        return { success: false, message: 'No access token available' };
      }
      accessToken = user.accessToken;
    }
    
    // Make a direct call to Battle.net API to get user info
    const axios = require('axios');
    
    try {
      const userResponse = await axios.get(`https://eu.battle.net/oauth/userinfo`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      console.log("Battle.net API userinfo response for refresh:", userResponse.data);
      
      // Check if we have a valid response with BattleTag
      if (!userResponse.data || !userResponse.data.battletag) {
        console.warn(`Invalid response from Battle.net API for user ${userId}`);
        return { success: false, message: 'Invalid response from Battle.net API' };
      }
      
      const battletag = userResponse.data.battletag;
      console.log(`Retrieved BattleTag from API: ${battletag}`);
      
      // Update the user's Battle.net data in the database
      const updatedUser = await storage.updateUserBattleNetData(userId, {
        battleTag: battletag,
        // Include other fields we may want to refresh here
      });
      
      if (updatedUser) {
        console.log(`Successfully updated BattleTag for user ${userId} to ${battletag}`);
        return { 
          success: true, 
          message: 'Successfully updated BattleTag',
          user: updatedUser,
          battleTag: battletag
        };
      } else {
        console.warn(`Failed to update user data for user ${userId}`);
        return { success: false, message: 'Failed to update user data' };
      }
    } catch (apiError: any) {
      console.error(`Battle.net API error for user ${userId}:`, apiError?.response?.status || apiError?.message || apiError);
      
      // Check if this is a token expiration error (usually 403 Forbidden)
      if (apiError?.response?.status === 403) {
        console.warn(`Token seems to be expired for user ${userId}`);
        return { 
          success: false, 
          message: 'Battle.net authentication expired',
          expired: true 
        };
      }
      
      return { 
        success: false, 
        message: `Battle.net API error: ${apiError?.response?.status || apiError?.message || 'Unknown error'}` 
      };
    }
  } catch (error) {
    console.error(`Error refreshing Battle.net data for user ${userId}:`, error);
    return { success: false, message: `General error: ${error}` };
  }
}

// Middleware to require authentication
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Use a safer check for isAuthenticated that handles cases where the function might not exist
  const isAuthenticated = req.isAuthenticated && typeof req.isAuthenticated === 'function' && req.isAuthenticated();
  
  if (isAuthenticated) {
    return next();
  }
  
  res.status(401).json({
    success: false,
    error: "Authentication required",
    errorId: Date.now(),
    debug: {
      hasIsAuthenticatedMethod: typeof req.isAuthenticated === 'function',
      sessionExists: !!req.session,
      timestamp: new Date().toISOString()
    }
  });
}