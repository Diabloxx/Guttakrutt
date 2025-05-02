/**
 * PHP Endpoint Simulation
 * 
 * This module simulates the PHP endpoints that would be used on guttakrutt.org
 * It's used for development and testing only, providing mock endpoints
 * that mirror what would be available in the MySQL production environment.
 */

import { Router, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import axios from 'axios';
import { storage } from '../storage';
import { authDirectCheckPhp } from './php-simulation/auth-direct-check.php';
import { handleAuthUserPhp } from './php-simulation/auth-user.php';
import { handleAuthCharactersPhp } from './php-simulation/auth-characters.php';

// Add necessary type declarations for session
declare module 'express-session' {
  interface SessionData {
    passport?: { 
      user: number 
    };
    oauthState?: string;
    phpSimDebug?: any;
  }
}

// Create a router for our PHP endpoint simulations
export const phpSimulationRouter = Router();

// Global error handler function for PHP endpoints
function handlePhpEndpointErrors(endpoint: string, req: Request, res: Response, fn: () => void) {
  try {
    console.log(`[PHP Simulation] ${endpoint} requested`);
    fn();
  } catch (error) {
    console.error(`[PHP Simulation] Error in ${endpoint}:`, error);
    res.status(500).json({
      error: true,
      message: 'Internal server error in PHP simulation',
      errorMessage: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
}

// Simulate /auth-status.php endpoint
phpSimulationRouter.get('/auth-status.php', (req: Request, res: Response) => {
  handlePhpEndpointErrors('/auth-status.php', req, res, () => {
    console.log('[Auth] Status check requested');

    let isUserAuthenticated = false;
    let userId = null;
    
    // Check for auth cookie first
    const authCookie = req.cookies?.guttakrutt_auth;
    if (authCookie) {
      try {
        const decodedCookie = Buffer.from(authCookie, 'base64').toString();
        const cookieData = JSON.parse(decodedCookie);
        
        if (cookieData.userId && cookieData.authenticated) {
          isUserAuthenticated = true;
          userId = cookieData.userId;
        }
      } catch (cookieError) {
        console.error('[Auth] Cookie error');
      }
    }
    
    // If not authenticated by cookie, try session
    if (!isUserAuthenticated) {
      try {
        // Try standard Passport.js method
        if (req.isAuthenticated && typeof req.isAuthenticated === 'function') {
          isUserAuthenticated = req.isAuthenticated();
          userId = req.user?.id;
        } 
        // Fallback: check session
        else if (req.session?.passport?.user) {
          isUserAuthenticated = true;
          userId = req.session.passport.user;
        }
      } catch (authError) {
        console.error('[Auth] Session error');
      }
    }
    
    // Return authentication status with minimal info
    res.json({
      authenticated: isUserAuthenticated,
      userId: isUserAuthenticated ? userId : null,
      timestamp: new Date().toISOString()
    });
  });
});

// Simulate /auth-bnet.php endpoint - direct implementation to avoid redirect issues
phpSimulationRouter.get('/auth-bnet.php', (req: Request, res: Response) => {
  console.log('[Auth] Initiating Battle.net login');
  
  // Generate a state parameter
  const state = "auth_" + Date.now().toString(36).slice(-10);
  
  // Store the state in a cookie for MySQL compatibility
  res.cookie('guttakrutt_auth_state', state, {
    maxAge: 10 * 60 * 1000, // 10 minutes
    httpOnly: true,
    path: '/',
    sameSite: 'lax'
  });
  
  // Also store a cookie with the return URL and timestamp to help with redirect loops
  const timestamp = Date.now();
  res.cookie('guttakrutt_auth_return', JSON.stringify({
    timestamp: timestamp,
    returnUrl: '/',  // Changed from '/profile' to root path
    authMethod: 'bnet-standard'
  }), {
    maxAge: 10 * 60 * 1000, // 10 minutes
    httpOnly: true,
    path: '/',
    sameSite: 'lax'
  });
  
  // Also try to store in session as a backup
  if (req.session) {
    (req.session as any).oauthState = state;
    (req.session as any).authTimestamp = timestamp;
    (req.session as any).authReturn = '/';  // Changed from '/profile' to root path
    req.session.save((err) => {
      if (err) {
        console.error("[Auth] Session save error:", err);
      }
    });
  }
  
  // Construct the URL for Battle.net auth
  const clientId = process.env.BLIZZARD_CLIENT_ID;
  const redirectUri = encodeURIComponent('https://guttakrutt.org/auth-callback.php');
  const scope = "openid wow.profile";
  
  // Ensure scope is properly URL-encoded
  const encodedScope = encodeURIComponent(scope);
  
  // Construct auth URL
  const authUrl = `https://oauth.battle.net/authorize?response_type=code&client_id=${clientId}&scope=${encodedScope}&state=${state}&redirect_uri=${redirectUri}`;
  
  // Only minimal logging for security
  console.log("[Auth] Redirecting to Battle.net");
  
  // Redirect to Battle.net
  res.redirect(authUrl);
});

// Simulate /auth-callback.php endpoint - handle Battle.net OAuth callback
phpSimulationRouter.get('/auth-callback.php', async (req: Request, res: Response, next: NextFunction) => {
  console.log('[PHP Simulation] /auth-callback.php requested - handling OAuth callback');
  
  // Extract OAuth parameters from the request
  const code = req.query.code as string;
  const state = req.query.state as string;
  const error = req.query.error as string;
  
  // Log the parameters for debugging
  console.log('[PHP Simulation] Auth callback received:', { 
    code: code ? 'present' : 'missing',
    state: state || 'missing',
    error: error || 'none',
    sessionID: req.sessionID || 'no session'
  });
  
  // Check if we have an error from Battle.net
  if (error) {
    console.error(`[PHP Simulation] OAuth error: ${error}`);
    return res.status(400).send(`
      <html>
        <head><title>Authentication Error</title></head>
        <body>
          <h1>Authentication Error</h1>
          <p>There was an error during authentication: ${error}</p>
          <p><a href="/">Return to home page</a></p>
        </body>
      </html>
    `);
  }

  // Check if we have the required code parameter
  if (!code) {
    console.error('[PHP Simulation] Missing code parameter in callback');
    return res.status(400).send(`
      <html>
        <head><title>Missing Code</title></head>
        <body>
          <h1>Authentication Error</h1>
          <p>The authorization code is missing from the callback.</p>
          <p><a href="/">Return to home page</a></p>
        </body>
      </html>
    `);
  }
  
  // For simulation, instead of passing to the actual callback handler,
  // we'll handle it directly to avoid middleware issues
  console.log('[PHP Simulation] Handling callback directly');
  
  try {
    // Exchange the code for an access token
    const tokenUrl = 'https://oauth.battle.net/token';
    const clientId = process.env.BLIZZARD_CLIENT_ID;
    const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;
    const redirectUri = 'https://guttakrutt.org/auth-callback.php';
    
    console.log(`[PHP Simulation] Exchanging code for token with: 
      - Code: ${code ? code.substring(0, 5) + '...' : 'undefined'}
      - Client ID present: ${!!clientId}
      - Client Secret present: ${!!clientSecret}
      - Redirect URI: ${redirectUri}
    `);
    
    try {
      // First, exchange the code for a token
      const tokenResponse = await axios.post(
        tokenUrl,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri
        }).toString(),
        {
          auth: {
            username: clientId!,
            password: clientSecret!
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      
      console.log(`[PHP Simulation] Token exchange successful, got access token: ${access_token.substring(0, 8)}...`);
      
      // Now get user info with the access token
      const userResponse = await axios.get('https://eu.api.blizzard.com/profile/user/wow', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Battlenet-Namespace': 'profile-eu'
        }
      });
      
      const userData = userResponse.data;
      
      // Log all property names at each level of the response object
      let responseStructure = "Response Object Structure:\n";
      
      function inspectObject(obj: any, path = "") {
        if (!obj || typeof obj !== 'object') return;
        
        // Get all property names at this level
        const props = Object.keys(obj);
        responseStructure += `${path ? path + "." : ""}Properties: ${props.join(", ")}\n`;
        
        // Recursively inspect nested objects
        for (const prop of props) {
          if (obj[prop] && typeof obj[prop] === 'object') {
            inspectObject(obj[prop], path ? `${path}.${prop}` : prop);
          }
        }
      }
      
      inspectObject(userResponse.data);
      console.log(responseStructure);
      
      console.log(`[PHP Simulation] Got user data: ${JSON.stringify(userData, null, 2)}`);
      
      // Specifically look for BattleTag with various case formats
      console.log('[PHP Simulation] BattleTag field inspection:');
      for (const key of Object.keys(userData)) {
        if (key.toLowerCase().includes('tag') || key.toLowerCase().includes('battle')) {
          console.log(`  - Field ${key}: ${userData[key]}`);
        }
      }
      
      // Check for OpenID Connect specific fields
      if (userData.sub) {
        console.log(`[PHP Simulation] Found OpenID Connect 'sub' field: ${userData.sub}`);
      }
      
      // Also check for Battle.net specific ID formats
      let battleNetId = userData.id || userData.sub;
      if (battleNetId) {
        console.log(`[PHP Simulation] Using ID: ${battleNetId}`);
      } else {
        console.log(`[PHP Simulation] Warning: No ID field found in user data`);
      }
      
      // In OpenID Connect flow, the Battle Tag might be in these fields
      const openIdBattleTag = userData.battletag || userData.name || userData.preferred_username;
      if (openIdBattleTag) {
        console.log(`[PHP Simulation] Found potential BattleTag in OpenID fields: ${openIdBattleTag}`);
      }
      
      // Handle different case formats of battletag field from Battle.net API
      // Ensure we have a proper BattleTag regardless of the field name casing
      const battleTag = userData.battleTag || userData.battletag || userData.battle_tag || 
                        userData.BattleTag || userData.Battletag || userData.BATTLETAG ||
                        // Check for OpenID Connect fields
                        userData.preferred_username || userData.name ||
                        // Check for sub-objects that might contain the BattleTag
                        (userData.account?.battleTag) || (userData.account?.battletag) ||
                        (userData.blizzard?.battleTag) || (userData.blizzard?.battletag) ||
                        (userData.user?.battleTag) || (userData.user?.battletag) ||
                        (userData.battle_net?.battle_tag) ||
                        // Default value if none found
                        'Unknown#0000';
      
      console.log(`[PHP Simulation] Extracted Battle Tag: ${battleTag}`);
      
      // Calculate token expiry
      const tokenExpiry = new Date();
      tokenExpiry.setSeconds(tokenExpiry.getSeconds() + expires_in);
      
      // Process the user data
      try {
        // Use the proper ID field - might be 'id' from old API or 'sub' from OpenID Connect
        const battleNetId = userData.id || userData.sub || '';
        console.log(`[PHP Simulation] Looking for existing user with Battle.net ID: ${battleNetId}`);
        
        // Try to find existing user with either field
        let existingUser = await storage.getUserByBattleNetId(battleNetId);
        
        // If not found with primary ID, try alternate fields if available
        if (!existingUser && userData.id && userData.sub && userData.id !== userData.sub) {
          console.log(`[PHP Simulation] User not found with primary ID, trying secondary ID: ${userData.id}`);
          existingUser = await storage.getUserByBattleNetId(userData.id);
        }
        
        let user;
        
        if (existingUser) {
          console.log(`[PHP Simulation] User with Battle.net ID ${battleNetId} already exists, updating...`);
          
          // First, update the tokens
          user = await storage.updateUserTokens(
            existingUser.id,
            access_token,
            refresh_token,
            tokenExpiry
          );
          console.log(`[PHP Simulation] Updated user tokens for user ID: ${existingUser.id}`);
          
          // Check if we need to refresh the BattleTag
          if (!existingUser.battleTag || existingUser.battleTag === 'Unknown#0000' || existingUser.battleTag.includes('Unknown')) {
            console.log(`[PHP Simulation] BattleTag missing or showing placeholder value: ${existingUser.battleTag || 'null'}`);
            
            try {
              // Import the refreshBattleNetUserData function from auth module
              const { refreshBattleNetUserData } = require('../auth/bnet-auth');
              
              // Attempt to refresh the user's BattleTag
              console.log(`[PHP Simulation] Refreshing BattleTag from Battle.net for user ${existingUser.id}...`);
              const refreshResult = await refreshBattleNetUserData(existingUser.id, access_token);
              
              if (refreshResult.success) {
                console.log(`[PHP Simulation] Successfully refreshed BattleTag to: ${refreshResult.battleTag}`);
                user = refreshResult.user; // Use the updated user data
              } else {
                console.warn(`[PHP Simulation] Failed to refresh BattleTag: ${refreshResult.message}`);
              }
            } catch (refreshError) {
              console.error(`[PHP Simulation] Error during BattleTag refresh:`, refreshError);
              // Continue despite error - we already have user tokens updated
            }
          } else {
            console.log(`[PHP Simulation] Keeping existing BattleTag: ${existingUser.battleTag}`);
          }
        } else {
          console.log(`[PHP Simulation] Creating new user for Battle.net ID: ${battleNetId}`);
          // Create a new user
          user = await storage.createUser({
            battleNetId: battleNetId,
            battleTag: battleTag, // Use our extracted battleTag variable
            accessToken: access_token,
            refreshToken: refresh_token,
            tokenExpiry: tokenExpiry,
            region: 'eu',
            locale: 'en_GB',
            isGuildMember: false,
            isOfficer: false
          });
          console.log(`[PHP Simulation] Created new user with ID: ${user.id}`);
        }
        
        // Store authentication in session - manually, without relying on passport's req.login
        if (user) {
          console.log('[PHP Simulation] Setting up manual cookie authentication');
          
          // Create a special cookie with authentication data
          // This simulates how PHP would handle auth - with its own cookie
          const authCookie = {
            userId: user.id,
            battleTag: user.battleTag,
            authenticated: true,
            timestamp: Date.now()
          };
          
          // Serialize to JSON and encode
          const cookieValue = Buffer.from(JSON.stringify(authCookie)).toString('base64');
          
          // Set a cookie that will be used for PHP-style authentication
          // This cookie will be read by /auth-user.php
          res.cookie('guttakrutt_auth', cookieValue, {
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            httpOnly: true,
            path: '/',
            sameSite: 'lax'
          });
          
          // ALSO set up the session for Express/Passport
          if (req.session) {
            console.log('[PHP Simulation] Also setting up session-based authentication');
            
            // Directly set up the passport session object
            req.session.passport = { user: user.id };
            
            // Add debug info to the session
            req.session.phpSimDebug = {
              originalUrl: req.originalUrl,
              timestamp: new Date().toISOString(),
              userDataReceived: true,
              userDataDump: JSON.stringify(userData),
              battletag: userData.battletag,
              extractedBattleTag: battleTag,
              battleTagCase: {
                battleTag: !!userData.battleTag,
                battletag: !!userData.battletag,
                battle_tag: !!userData.battle_tag,
                BattleTag: !!userData.BattleTag,
                Battletag: !!userData.Battletag,
                BATTLETAG: !!userData.BATTLETAG
              },
              userId: user.id,
              cookieSet: true
            };
            
            // Also set req.user directly to support subsequent middleware that might check it
            (req as any).user = user;
            
            // Force save the session to ensure the auth data is persisted
            req.session.save((err) => {
              if (err) {
                console.error('[PHP Simulation] Error saving session:', err);
                // Continue anyway since we have the cookie
                console.log('[PHP Simulation] Continuing with cookie authentication only');
              } else {
                console.log('[PHP Simulation] Session saved successfully');
              }
              
              // Send success HTML that will make our JSON parser detect authentication
              console.log('[PHP Simulation] Auth successful, returning success page');
              res.send(`
                <html>
                  <head><title>Authentication Successful</title></head>
                  <body>
                    <h1>Authentication Successful</h1>
                    <p>You are now logged in as ${user.battleTag}</p>
                    <p>Session ID: ${req.sessionID || 'none'}</p>
                    <p>Authentication Cookie Set: Yes</p>
                    <p>Auth Data: {"authenticated":true,"userId":${user.id},"battleTag":"${user.battleTag}"}</p>
                    <script>
                      // Set a session flag for the auth check
                      document.cookie = "auth_redirect=true; path=/; max-age=60;";
                      // Using direct redirect to include "auth_redirect=true" parameter 
                      // to signal successful authentication
                      setTimeout(function() {
                        // Redirect to home and trigger sidebar open event
                        window.location.href = '/?login=success&userId=${user.id}&t=' + Date.now();
                      }, 500);
                    </script>
                    <p><a href="/?login=success&userId=${user.id}">Click here if not automatically redirected</a></p>
                  </body>
                </html>
              `);
            });
          } else {
            // No session but we have the cookie, so still OK
            console.log('[PHP Simulation] No session available, using cookie authentication only');
            
            // Send success HTML
            res.send(`
              <html>
                <head><title>Authentication Successful (Cookie Only)</title></head>
                <body>
                  <h1>Authentication Successful</h1>
                  <p>You are now logged in as ${user.battleTag}</p>
                  <p>Session: Not available</p>
                  <p>Authentication Cookie Set: Yes</p>
                  <p>Auth Data: {"authenticated":true,"userId":${user.id},"battleTag":"${user.battleTag}"}</p>
                  <script>
                    // These cookies help the client side know this was a successful authentication
                    // and provide fallback mechanisms if the server-side session isn't immediately ready
                    document.cookie = "auth_redirect=true; path=/; max-age=60;";
                    document.cookie = "auth_user_id=${user.id}; path=/; max-age=60;";
                    document.cookie = "auth_battle_tag=${encodeURIComponent(user.battleTag)}; path=/; max-age=60;";
                    
                    // Save the login status in localStorage too as a triple fallback
                    try {
                      localStorage.setItem('guttakrutt_auth_timestamp', Date.now().toString());
                      localStorage.setItem('guttakrutt_auth_user_id', '${user.id}');
                      localStorage.setItem('guttakrutt_auth_battle_tag', '${user.battleTag}');
                    } catch(e) {
                      console.error('Failed to save auth data to localStorage:', e);
                    }
                    
                    // Redirect to homepage after a delay, with userId parameter to help
                    // client-side code handle the auth state
                    setTimeout(function() {
                      // Redirect to home and trigger sidebar open event
                      window.location.href = '/?login=success&userId=${user.id}&battleTag=${encodeURIComponent(user.battleTag)}&t=' + Date.now();
                    }, 500);
                  </script>
                  <p><a href="/?login=success&userId=${user.id}&battleTag=${encodeURIComponent(user.battleTag)}">Click here if not automatically redirected</a></p>
                </body>
              </html>
            `);
          }
        } else {
          console.error('[PHP Simulation] User creation or update failed!');
          res.status(500).send(`
            <html>
              <head><title>User Error</title></head>
              <body>
                <h1>User Creation Error</h1>
                <p>Failed to create or update user account.</p>
                <p><a href="/">Return to home page</a></p>
              </body>
            </html>
          `);
        }
      } catch (dbError) {
        console.error('[PHP Simulation] Database error:', dbError);
        res.status(500).send(`
          <html>
            <head><title>Database Error</title></head>
            <body>
              <h1>Database Error</h1>
              <p>There was an error processing your account: ${dbError instanceof Error ? dbError.message : String(dbError)}</p>
              <p><a href="/">Return to home page</a></p>
            </body>
          </html>
        `);
      }
    } catch (apiError: any) {
      console.error('[PHP Simulation] Error in API operations:', apiError.response?.data || apiError.message);
      
      // Check for invalid_grant error
      if (apiError.response?.data?.error === 'invalid_grant') {
        return res.status(400).send(`
          <html>
            <head><title>Authorization Error</title></head>
            <body>
              <h1>Authorization Error</h1>
              <p>The authorization code has expired or is invalid. Please try logging in again.</p>
              <p>Error details: ${apiError.response.data.error_description}</p>
              <p><a href="/">Return to home page</a></p>
            </body>
          </html>
        `);
      }
      
      // Handle other errors
      res.status(500).send(`
        <html>
          <head><title>Authentication Error</title></head>
          <body>
            <h1>Authentication Error</h1>
            <p>There was an error during authentication: ${apiError.message}</p>
            <p><a href="/">Return to home page</a></p>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('[PHP Simulation] Unexpected error in callback:', error);
    res.status(500).send(`
      <html>
        <head><title>Unexpected Error</title></head>
        <body>
          <h1>Unexpected Error</h1>
          <p>An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}</p>
          <p><a href="/">Return to home page</a></p>
        </body>
      </html>
    `);
  }
});

// Simulate /auth-bnet-direct.php endpoint with direct implementation
phpSimulationRouter.get('/auth-bnet-direct.php', (req: Request, res: Response) => {
  // Minimal logging - don't log full request details
  console.log('[PHP Simulation] Starting Battle.net auth process');
  
  // Generate a state parameter with timestamp for uniqueness
  const timestamp = Date.now();
  const state = "auth_" + timestamp.toString(36).slice(-10);
  
  // Store the state in a cookie rather than relying solely on session
  // This ensures it works with both PostgreSQL and MySQL environments
  res.cookie('guttakrutt_auth_state', state, {
    maxAge: 10 * 60 * 1000, // 10 minutes
    httpOnly: true,
    path: '/',
    sameSite: 'lax'
  });
  
  // Also store a cookie with the return URL and timestamp to help with redirect loops
  res.cookie('guttakrutt_auth_return', JSON.stringify({
    timestamp: timestamp,
    returnUrl: '/',  // Changed from '/profile' to root path
    authMethod: 'bnet-direct'
  }), {
    maxAge: 10 * 60 * 1000, // 10 minutes
    httpOnly: true,
    path: '/',
    sameSite: 'lax'
  });
  
  // Try to store in session as a backup
  if (req.session) {
    (req.session as any).oauthState = state;
    (req.session as any).authTimestamp = timestamp;
    (req.session as any).authReturn = '/';  // Changed from '/profile' to root path
    req.session.save((err) => {
      if (err) {
        console.error("[Auth] Session save error");
      }
    });
  }
  
  // Construct the URL - use auth-callback.php for production compatibility
  const clientId = process.env.BLIZZARD_CLIENT_ID;
  const redirectUri = encodeURIComponent('https://guttakrutt.org/auth-callback.php'); 
  const scope = "openid wow.profile";
  
  // Ensure scope is properly URL-encoded
  const encodedScope = encodeURIComponent(scope);
  
  // Add timestamp to the state to help with validation
  const stateWithTimestamp = `${state}:${timestamp}`;  
  const authUrl = `https://oauth.battle.net/authorize?response_type=code&client_id=${clientId}&scope=${encodedScope}&state=${stateWithTimestamp}&redirect_uri=${redirectUri}`;
  
  // No debug info in logs about auth URL
  console.log("[Auth] Redirecting to Battle.net");
  
  // Redirect to Battle.net
  res.redirect(authUrl);
});

// Simulate /auth-logout.php endpoint - Enhanced version for guttakrutt.org
// Optimized for Windows/MySQL environment compatibility
phpSimulationRouter.get('/auth-logout.php', (req: Request, res: Response) => {
  console.log('[PHP Simulation] /auth-logout.php requested');
  
  // Special handling for Windows/MySQL environment
  const wantsJson = req.get('Accept') === 'application/json' || req.query.format === 'json';
  const forceCleanCookies = !!req.query.force_clean || req.query.force === 'true';
  
  // Log the request details for debugging
  console.log(`[PHP Simulation] Logout request details - wants JSON: ${wantsJson}, force clean: ${forceCleanCookies}`);
  console.log(`[PHP Simulation] Logout request headers: Accept=${req.get('Accept')}`);
  console.log(`[PHP Simulation] Logout request query params:`, req.query);
  
  // Function to clear all authentication cookies
  const clearAllCookies = () => {
    // Clear standard session cookie
    res.clearCookie('connect.sid', { path: '/' });
    
    // Clear PHP simulation cookies with all possible path combinations
    res.clearCookie('guttakrutt_auth', { path: '/' });
    res.clearCookie('auth_redirect', { path: '/' });
    res.clearCookie('auth_user_id', { path: '/' });
    res.clearCookie('auth_battle_tag', { path: '/' });
    
    // Also clear cookies with explicit domain in case they were set that way
    const domain = req.hostname;
    if (domain.includes('guttakrutt.org')) {
      res.clearCookie('connect.sid', { path: '/', domain });
      res.clearCookie('guttakrutt_auth', { path: '/', domain });
      res.clearCookie('auth_redirect', { path: '/', domain });
      res.clearCookie('auth_user_id', { path: '/', domain });
      res.clearCookie('auth_battle_tag', { path: '/', domain });
    }
    
    console.log('[PHP Simulation] Cleared all authentication cookies');
  };
  
  // Function to send the final response
  const sendResponse = () => {
    // Always clear cookies again to be extra safe
    clearAllCookies();
    
    // Include cache-busting in the redirect
    const cacheBuster = new Date().getTime();
    console.log('[PHP Simulation] Logout completed, sending response');
    
    if (wantsJson) {
      res.status(200).json({
        success: true,
        loggedOut: true,
        message: "Logout successful, all authentication cleared",
        timestamp: cacheBuster
      });
    } else {
      // Redirect to home page after successful logout with cache buster
      res.redirect(`/?clear_session=${cacheBuster}`);
    }
  };
  
  // If force clean is requested, skip session handling and just clear cookies
  if (forceCleanCookies) {
    console.log('[PHP Simulation] Force clean requested, skipping session handling');
    clearAllCookies();
    sendResponse();
    return;
  }
  
  // First try using Passport's logout function
  if (req.logout) {
    console.log('[PHP Simulation] Using Passport logout method');
    req.logout((err) => {
      if (err) {
        console.error('[PHP Simulation] Error during passport logout:', err);
        // Continue despite the error
      }
      
      // Now completely destroy the session
      if (req.session) {
        console.log('[PHP Simulation] Destroying session');
        req.session.destroy((err) => {
          if (err) {
            console.error('[PHP Simulation] Error destroying session:', err);
            // Continue anyway by clearing cookies manually
            clearAllCookies();
            sendResponse();
          } else {
            // Session destroyed successfully
            console.log('[PHP Simulation] Session destroyed successfully');
            sendResponse();
          }
        });
      } else {
        // No session to destroy
        console.log('[PHP Simulation] No session to destroy, clearing cookies');
        sendResponse();
      }
    });
  } else {
    // Fallback if req.logout doesn't exist
    console.log('[PHP Simulation] Passport logout not available, using fallback');
    if (req.session) {
      console.log('[PHP Simulation] Destroying session (fallback method)');
      req.session.destroy((err) => {
        if (err) {
          console.error('[PHP Simulation] Error destroying session (fallback):', err);
          return res.status(500).json({ error: 'Failed to logout' });
        }
        
        res.clearCookie('connect.sid');
        res.clearCookie('guttakrutt_auth');
        res.clearCookie('auth_redirect');
        res.clearCookie('auth_user_id');
        res.clearCookie('auth_battle_tag');
        console.log('[PHP Simulation] Logout fallback successful, session destroyed');
        
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
      console.log('[PHP Simulation] No session or logout method available');
      
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
});

// Simulate /auth-characters.php endpoint
// The /auth-characters.php endpoint is now handled by the handleAuthCharactersPhp router
// (see routes.php-simulation/auth-characters.php.ts for implementation)

// Simulate /auth-user.php endpoint
phpSimulationRouter.get('/auth-user.php', async (req: Request, res: Response) => {
  try {
    console.log('[Auth] User info requested');
    
    // Set content type explicitly to ensure proper parsing
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    // Initialize variables
    let isAuthenticated = false;
    let userData = null;
    let authMethod = 'none';
    let userId: number | null = null;
    
    // Check cookies first (PHP style)
    const authCookie = req.cookies?.guttakrutt_auth;
    if (authCookie) {
      try {
        // Decode and parse the cookie
        const decodedCookie = Buffer.from(authCookie, 'base64').toString();
        const cookieData = JSON.parse(decodedCookie);
        
        // Only minimal logging - no personal data
        console.log('[Auth] Processing auth cookie');
        
        if (cookieData.userId && cookieData.authenticated) {
          userId = cookieData.userId;
          isAuthenticated = true;
          authMethod = 'cookie';
        }
      } catch (cookieError) {
        console.error('[Auth] Error parsing auth cookie');
      }
    }
    
    // If not authenticated by cookie, try session (Express/Passport style)
    if (!isAuthenticated) {
      try {
        // First try the standard Passport.js method
        if (req.isAuthenticated && typeof req.isAuthenticated === 'function') {
          isAuthenticated = req.isAuthenticated();
          if (isAuthenticated && req.user) {
            userId = req.user.id;
            authMethod = 'passport';
          }
        } else if (req.session?.passport?.user) {
          // Fallback: manually check session for authentication data
          userId = req.session.passport.user;
          isAuthenticated = true;
          authMethod = 'session';
        }
      } catch (authError) {
        console.error('[Auth] Error checking session auth');
      }
    }
    
    console.log('[Auth] Auth check complete');
    
    // If authenticated with any method, get the user data
    if (isAuthenticated && userId) {
      try {
        // Get full user data from database
        const user = await storage.getUser(userId);
        if (user) {
          // Return a sanitized version of the user data (no tokens)
          userData = {
            id: user.id,
            battleTag: user.battleTag,
            battleNetId: user.battleNetId,
            isGuildMember: user.isGuildMember,
            isOfficer: user.isOfficer,
            lastLogin: user.lastLogin,
            createdAt: user.createdAt,
            region: user.region,
            locale: user.locale,
            avatarUrl: user.avatarUrl
          };
          
          // If we found the user via session but don't have a cookie yet, set the cookie
          if (authMethod !== 'cookie') {
            const newAuthCookie = {
              userId: user.id,
              battleTag: user.battleTag,
              authenticated: true,
              timestamp: Date.now()
            };
            
            // Serialize to JSON and encode
            const cookieValue = Buffer.from(JSON.stringify(newAuthCookie)).toString('base64');
            
            // Set a cookie that will be used for PHP-style authentication
            res.cookie('guttakrutt_auth', cookieValue, {
              maxAge: 24 * 60 * 60 * 1000, // 24 hours
              httpOnly: true,
              path: '/',
              sameSite: 'lax'
            });
          }
        }
      } catch (error) {
        console.error('[Auth] Database error');
      }
    }
    
    // Check for auth_redirect cookie which might have been set in auth-callback.php
    const authRedirect = req.cookies?.auth_redirect === 'true';
    
    // If the auth_redirect cookie exists but we don't have session data yet,
    // we might be in a race condition where the auth happened but session isn't saved
    if (authRedirect && !isAuthenticated) {
      console.log('[Auth] Found auth_redirect cookie but session not ready yet');
      
      // If we have userId in url parameters (from the redirect), we can try to load the user directly
      const urlUserId = req.query.userId; 
      if (urlUserId && !isNaN(Number(urlUserId))) {
        try {
          const userId = Number(urlUserId);
          const user = await storage.getUser(userId);
          
          if (user) {
            console.log(`[Auth] Found user ${user.id} from URL parameter`);
            userData = {
              id: user.id,
              battleTag: user.battleTag,
              battleNetId: user.battleNetId,
              isGuildMember: user.isGuildMember,
              isOfficer: user.isOfficer,
              lastLogin: user.lastLogin,
              createdAt: user.createdAt,
              region: user.region,
              locale: user.locale,
              avatarUrl: user.avatarUrl
            };
            isAuthenticated = true;
            authMethod = 'url_param';
            
            // Set the user in session for future requests
            req.login(user, (err) => {
              if (err) console.error('[Auth] Error setting user in session:', err);
            });
            
            // Also set an auth cookie
            const newAuthCookie = {
              userId: user.id,
              battleTag: user.battleTag,
              authenticated: true,
              timestamp: Date.now()
            };
            
            const cookieValue = Buffer.from(JSON.stringify(newAuthCookie)).toString('base64');
            res.cookie('guttakrutt_auth', cookieValue, {
              maxAge: 24 * 60 * 60 * 1000,
              httpOnly: true,
              path: '/',
              sameSite: 'lax'
            });
          }
        } catch (e) {
          console.error('[Auth] Error loading user from URL parameter');
        }
      }
    }
    
    // Return response formatted exactly as AuthResponse interface in profile.tsx expects
    res.json({
      authenticated: isAuthenticated,
      user: userData,
      debug: {
        source: '/auth-user.php',
        method: authMethod,
        authRedirectCookie: authRedirect,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`[Auth] Unexpected error`);
    res.status(500).json({
      authenticated: false,
      user: null,
      debug: {
        source: '/auth-user.php',
        error: "Internal server error"
      }
    });
  }
});
// Mount all the PHP simulation endpoints
phpSimulationRouter.use('/auth-direct-check.php', authDirectCheckPhp);
phpSimulationRouter.use('/auth-user.php', handleAuthUserPhp);
phpSimulationRouter.use('/auth-characters.php', handleAuthCharactersPhp);
