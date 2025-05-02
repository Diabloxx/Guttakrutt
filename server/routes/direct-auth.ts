/**
 * Direct Authentication Routes
 * 
 * These routes provide a simplified and direct way to handle Battle.net authentication
 * They're designed to be used for debugging and testing authentication flows
 * without the complexity of the main authentication system.
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { storage } from '../storage';

export const directAuthRouter = Router();

// Direct API endpoint to get authentication status
directAuthRouter.get('/status', (req, res) => {
  console.log('[Direct Auth] Status check');
  
  res.json({
    authenticated: !!(req.isAuthenticated && req.isAuthenticated()),
    user: req.user || null,
    session: {
      id: req.sessionID || 'none',
      exists: !!req.session,
      cookie: req.session?.cookie ? {
        expires: req.session.cookie.expires,
        maxAge: req.session.cookie.maxAge
      } : null
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      platform: process.platform,
      timestamp: new Date().toISOString()
    }
  });
});

// Direct API endpoint to initiate Battle.net authentication
directAuthRouter.get('/login', (req, res) => {
  console.log('[Direct Auth] Login request');
  
  try {
    // Generate a simple state parameter
    const state = `direct_${Date.now()}`;
    
    // Store state in session
    if (req.session) {
      req.session.oauthState = state;
      console.log('[Direct Auth] State saved to session:', state);
    }
    
    // Create Battle.net auth URL directly
    const clientId = process.env.BLIZZARD_CLIENT_ID;
    if (!clientId) {
      return res.status(500).send('Battle.net client ID not configured');
    }
    
    const redirectUri = encodeURIComponent(`${req.protocol}://${req.headers.host}/api/direct/callback`);
    const scope = 'openid wow.profile';
    
    const authUrl = `https://oauth.battle.net/authorize?response_type=code&client_id=${clientId}&scope=${scope}&state=${state}&redirect_uri=${redirectUri}`;
    
    console.log('[Direct Auth] Redirecting to Battle.net:', authUrl);
    res.redirect(authUrl);
  } catch (error) {
    console.error('[Direct Auth] Error during login:', error);
    res.status(500).send('Error during login process');
  }
});

// Direct API endpoint to handle Battle.net OAuth callback
directAuthRouter.get('/callback', async (req, res) => {
  console.log('[Direct Auth] Callback received');
  
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;
    
    if (!code) {
      return res.status(400).send('Missing authorization code');
    }
    
    console.log('[Direct Auth] Processing code:', code.substring(0, 5) + '...');
    
    // Exchange code for token
    const tokenUrl = 'https://oauth.battle.net/token';
    const clientId = process.env.BLIZZARD_CLIENT_ID;
    const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return res.status(500).send('Battle.net credentials not configured');
    }
    
    const redirectUri = `${req.protocol}://${req.headers.host}/api/direct/callback`;
    
    // Get token
    const tokenResponse = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      }).toString(),
      {
        auth: {
          username: clientId,
          password: clientSecret
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    // Get user info
    const userResponse = await axios.get('https://eu.api.blizzard.com/profile/user/wow', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Battlenet-Namespace': 'profile-eu'
      }
    });
    
    const userData = userResponse.data;
    
    // Calculate token expiry
    const tokenExpiry = new Date();
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + expires_in);
    
    // Find or create user
    let user = await storage.getUserByBattleNetId(userData.id.toString());
    
    if (user) {
      // Update existing user
      user = await storage.updateUserTokens(
        user.id,
        access_token,
        refresh_token,
        tokenExpiry
      ) || user;
    } else {
      // Create new user
      user = await storage.createUser({
        battleNetId: userData.id.toString(),
        battleTag: userData.battletag,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiry,
        region: 'eu',
        email: '',
        lastLogin: new Date(),
        createdAt: new Date(),
        isGuildMember: false,
        isOfficer: false,
        locale: 'en_GB',
        avatarUrl: ''
      });
    }
    
    // Set up session manually
    if (req.login) {
      req.login(user, (err) => {
        if (err) {
          console.error('[Direct Auth] Login error:', err);
          return res.status(500).json({
            error: true,
            message: 'Login error: ' + err.message,
            authenticated: false
          });
        }
        
        // Before redirecting, set a success flag in the session
        if (req.session) {
          // Add custom properties to the session object
          (req.session as any).authSuccess = true;
          (req.session as any).authMethod = 'direct';
          (req.session as any).authTimestamp = Date.now();
        }
        
        // Always send JSON response for auth endpoints if requested
        const wantsJson = req.headers.accept?.includes('application/json') ||
                         req.query.format === 'json';
        
        if (wantsJson) {
          console.log('[Direct Auth] Login successful, responding with JSON');
          res.json({
            success: true,
            user: {
              id: user.id,
              battleTag: user.battleTag,
              isGuildMember: user.isGuildMember,
              isOfficer: user.isOfficer,
            },
            redirectUrl: '/?login=success&method=direct',
            authenticated: true
          });
        } else {
          // Redirect to homepage with success message
          console.log('[Direct Auth] Login successful, redirecting to homepage');
          res.redirect('/?login=success&method=direct');
        }
      });
    } else if (req.session) {
      // Fallback if req.login is not available
      req.session.passport = { user: user.id };
      (req.session as any).authSuccess = true;
      (req.session as any).authMethod = 'direct-session';
      (req.session as any).authTimestamp = Date.now();
      
      req.session.save((err) => {
        if (err) {
          console.error('[Direct Auth] Session save error:', err);
          return res.status(500).json({
            error: true,
            message: 'Session error: ' + (err?.message || 'Unknown session error'),
            authenticated: false
          });
        }
        
        // Always send JSON response for auth endpoints if requested
        const wantsJson = req.headers.accept?.includes('application/json') ||
                         req.query.format === 'json';
        
        if (wantsJson) {
          console.log('[Direct Auth] Login successful using session fallback, responding with JSON');
          res.json({
            success: true,
            user: {
              id: user.id,
              battleTag: user.battleTag,
              isGuildMember: user.isGuildMember,
              isOfficer: user.isOfficer,
            },
            redirectUrl: '/?login=success&method=direct-session',
            authenticated: true
          });
        } else {
          // Redirect to homepage with success message
          console.log('[Direct Auth] Login successful using session fallback, redirecting to homepage');
          res.redirect('/?login=success&method=direct-session');
        }
      });
    } else {
      // No usable authentication method available
      const errorMessage = 'Session and login methods are not available';
      console.error('[Direct Auth] ' + errorMessage);
      
      // Check if client prefers JSON response
      const wantsJson = req.headers.accept?.includes('application/json') ||
                       req.query.format === 'json';
      
      if (wantsJson) {
        res.status(500).json({
          error: true,
          message: errorMessage,
          authenticated: false
        });
      } else {
        // Default to HTML response with clear error
        res.status(500).send(`
          <html>
            <head><title>Authentication Error</title></head>
            <body>
              <h1>Authentication Error</h1>
              <p>${errorMessage}</p>
              <p><a href="/">Return to Home</a></p>
            </body>
          </html>
        `);
      }
    }
  } catch (error: any) {
    console.error('[Direct Auth] Error during callback:', error.response?.data || error.message);
    
    // Check if client prefers JSON response
    const wantsJson = req.headers.accept?.includes('application/json') ||
                     req.query.format === 'json';
    
    if (wantsJson) {
      res.status(500).json({
        error: true,
        message: `Authentication error: ${error.message}`,
        details: error.response?.data || null,
        authenticated: false
      });
    } else {
      // Send a user-friendly HTML error for browser requests
      res.status(500).send(`
        <html>
          <head>
            <title>Authentication Error</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 2rem; text-align: center; background: #1a1a1a; color: #e0e0e0; }
              h1 { color: #ff5555; }
              .container { max-width: 600px; margin: 0 auto; padding: 2rem; background: #2a2a2a; border-radius: 8px; }
              .error-details { margin-top: 1rem; padding: 1rem; background: #333; border-radius: 4px; text-align: left; }
              a { color: #4da6ff; text-decoration: none; }
              a:hover { text-decoration: underline; }
              .button { display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: #4da6ff; color: white; border-radius: 4px; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Authentication Error</h1>
              <p>There was a problem processing your Battle.net authentication:</p>
              <div class="error-details">
                <code>${error.message}</code>
              </div>
              <p>This could be due to expired credentials or a temporary issue with the Battle.net service.</p>
              <a href="/" class="button">Return to Home</a>
            </div>
          </body>
        </html>
      `);
    }
  }
});

// Direct API endpoint for client-side auth check with userId
directAuthRouter.get('/direct-check', async (req, res) => {
  console.log('[Direct Auth] Direct auth check requested');
  
  try {
    // Get userId from query param
    const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : null;
    
    // Already authenticated?
    let isAuthenticated = false;
    if (req.isAuthenticated && typeof req.isAuthenticated === 'function') {
      isAuthenticated = req.isAuthenticated();
    }
    
    // If already authenticated, just return success
    if (isAuthenticated && req.user) {
      return res.json({ 
        success: true,
        authenticated: true,
        method: 'session',
        message: 'User is already authenticated'
      });
    }
    
    // If no userId provided, we can't do anything
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        authenticated: false,
        error: 'Missing or invalid userId parameter'
      });
    }
    
    // Try to get the user
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        authenticated: false,
        error: 'User not found'
      });
    }
    
    // We found the user - attempt to authenticate the session
    if (req.login) {
      // Use Passport's login method to set up the session
      req.login(user, (err) => {
        if (err) {
          console.error('[Direct Auth] Login error:', err);
          return res.status(500).json({
            success: false,
            authenticated: false,
            error: 'Session setup error: ' + err.message
          });
        }
        
        // Success!
        res.json({
          success: true,
          authenticated: true,
          method: 'direct-login',
          message: 'User authenticated via direct login',
          user: {
            id: user.id,
            battleTag: user.battleTag
          }
        });
      });
    } else if (req.session) {
      // Fallback: set the user ID in the session manually
      req.session.passport = { user: user.id };
      
      req.session.save((err) => {
        if (err) {
          console.error('[Direct Auth] Session save error:', err);
          return res.status(500).json({
            success: false,
            authenticated: false,
            error: 'Session save error: ' + err.message
          });
        }
        
        // Success!
        res.json({
          success: true,
          authenticated: true,
          method: 'direct-session',
          message: 'User authenticated via direct session update',
          user: {
            id: user.id,
            battleTag: user.battleTag
          }
        });
      });
    } else {
      // No authentication mechanisms available
      res.status(500).json({
        success: false,
        authenticated: false,
        error: 'No authentication mechanisms available'
      });
    }
  } catch (error: any) {
    console.error('[Direct Auth] Error during direct auth check:', error);
    res.status(500).json({
      success: false,
      authenticated: false,
      error: error.message || 'Unknown error during authentication check'
    });
  }
});

// Debug endpoint for quick authentication without Battle.net
directAuthRouter.get('/debug-login', async (req, res) => {
  console.log('[Direct Auth] Debug login requested - FOR DEVELOPMENT USE ONLY');
  
  // This is a special development-only endpoint for testing authentication
  if (process.env.NODE_ENV === 'production') {
    console.warn('[Direct Auth] Debug login endpoint accessed in production environment');
    return res.status(403).json({
      success: false,
      error: 'Debug login is not available in production'
    });
  }
  
  try {
    // Try to find an existing user, or create a test user if needed
    let user = await storage.getUser(1);
    
    if (!user) {
      console.log('[Direct Auth] Creating test user for debug login');
      
      // Create a test user for debug login
      user = await storage.createUser({
        battleNetId: 'debug123',
        battleTag: 'DebugUser#1234',
        accessToken: 'debug_access_token',
        refreshToken: 'debug_refresh_token',
        tokenExpiry: new Date(Date.now() + 3600000), // 1 hour
        region: 'eu',
        email: 'debug@example.com',
        lastLogin: new Date(),
        createdAt: new Date(),
        isGuildMember: true,
        isOfficer: true,
        locale: 'en_GB',
        avatarUrl: ''
      });
      
      console.log('[Direct Auth] Created test user with ID:', user.id);
    } else {
      console.log('[Direct Auth] Found existing user with ID:', user.id);
    }
    
    // Authenticate the user using req.login if available
    if (req.login) {
      req.login(user, (err) => {
        if (err) {
          console.error('[Direct Auth] Debug login error:', err);
          return res.status(500).json({
            success: false,
            error: 'Login error: ' + err.message
          });
        }
        
        // Set cookies for client-side tracking
        res.cookie('auth_redirect', 'true', { path: '/', maxAge: 60000 });
        res.cookie('auth_user_id', user.id.toString(), { path: '/', maxAge: 60000 });
        res.cookie('auth_battle_tag', user.battleTag, { path: '/', maxAge: 60000 });
        
        // Success!
        res.json({
          success: true,
          authenticated: true,
          method: 'debug-login',
          message: 'Debug login successful',
          user: {
            id: user.id,
            battleTag: user.battleTag,
            isGuildMember: user.isGuildMember,
            isOfficer: user.isOfficer
          }
        });
      });
    } else if (req.session) {
      // Fallback: set the user ID in the session manually
      req.session.passport = { user: user.id };
      
      req.session.save((err) => {
        if (err) {
          console.error('[Direct Auth] Debug login session save error:', err);
          return res.status(500).json({
            success: false,
            error: 'Session save error: ' + err.message
          });
        }
        
        // Set cookies for client-side tracking
        res.cookie('auth_redirect', 'true', { path: '/', maxAge: 60000 });
        res.cookie('auth_user_id', user.id.toString(), { path: '/', maxAge: 60000 });
        res.cookie('auth_battle_tag', user.battleTag, { path: '/', maxAge: 60000 });
        
        // Success!
        res.json({
          success: true,
          authenticated: true,
          method: 'debug-session',
          message: 'Debug login successful via session update',
          user: {
            id: user.id,
            battleTag: user.battleTag,
            isGuildMember: user.isGuildMember,
            isOfficer: user.isOfficer
          }
        });
      });
    } else {
      // No authentication mechanisms available
      res.status(500).json({
        success: false,
        error: 'No authentication mechanisms available'
      });
    }
  } catch (error: any) {
    console.error('[Direct Auth] Error during debug login:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Unknown error during debug login'
    });
  }
});

// Direct API endpoint to log out
directAuthRouter.get('/logout', (req, res) => {
  console.log('[Direct Auth] Logout request');
  
  // Check if client prefers JSON response
  const wantsJson = req.headers.accept?.includes('application/json') ||
                   req.query.format === 'json';
  
  if (req.logout) {
    req.logout((err) => {
      if (err) {
        console.error('[Direct Auth] Logout error:', err);
        
        if (wantsJson) {
          return res.status(500).json({
            success: false,
            error: true,
            message: 'Logout error: ' + (err?.message || 'Unknown error')
          });
        }
      }
      
      if (wantsJson) {
        res.json({
          success: true,
          message: 'Logged out successfully'
        });
      } else {
        res.redirect('/?logout=success');
      }
    });
  } else if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('[Direct Auth] Session destroy error:', err);
        
        if (wantsJson) {
          return res.status(500).json({
            success: false,
            error: true,
            message: 'Session destroy error: ' + (err?.message || 'Unknown error')
          });
        }
      }
      
      if (wantsJson) {
        res.json({
          success: true,
          message: 'Logged out successfully'
        });
      } else {
        res.redirect('/?logout=success');
      }
    });
  } else {
    if (wantsJson) {
      res.status(400).json({
        success: false,
        error: true,
        message: 'No active session found'
      });
    } else {
      res.redirect('/?logout=failed');
    }
  }
});