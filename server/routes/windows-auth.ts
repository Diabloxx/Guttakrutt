/**
 * Windows-specific authentication endpoints
 * 
 * These are ultra-simplified authentication handlers for Windows/MySQL environment
 * They bypass many of the complex checks and validations to provide a more reliable
 * authentication experience.
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { storage } from '../storage';

export const windowsAuthRouter = Router();

// Simple status check
windowsAuthRouter.get('/status', (req, res) => {
  console.log('[Windows Auth] Status check');
  
  // Send current auth status
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
    timestamp: new Date().toISOString()
  });
});

// Direct login endpoint that builds the Battle.net auth URL manually
windowsAuthRouter.get('/login', (req, res) => {
  console.log('[Windows Auth] Login request');
  
  try {
    // Generate a simple state parameter
    const state = `windows_${Date.now()}`;
    
    // Store state in session
    if (req.session) {
      req.session.oauthState = state;
      console.log('[Windows Auth] State saved to session:', state);
    }
    
    // Create Battle.net auth URL directly
    const clientId = process.env.BLIZZARD_CLIENT_ID;
    if (!clientId) {
      return res.status(500).send('Battle.net client ID not configured');
    }
    
    // Use a windows-specific callback that has minimal processing
    const redirectUri = encodeURIComponent('https://guttakrutt.org/windows-callback');
    const scope = 'openid wow.profile';
    
    const authUrl = `https://oauth.battle.net/authorize?response_type=code&client_id=${clientId}&scope=${scope}&state=${state}&redirect_uri=${redirectUri}`;
    
    console.log('[Windows Auth] Redirecting to Battle.net:', authUrl);
    res.redirect(authUrl);
  } catch (error) {
    console.error('[Windows Auth] Error during login:', error);
    res.status(500).send('Error during login process');
  }
});

// Simple, direct callback handler for Windows environment
windowsAuthRouter.get('/callback', async (req, res) => {
  console.log('[Windows Auth] Callback received');
  
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;
    
    if (!code) {
      return res.status(400).send('Missing authorization code');
    }
    
    console.log('[Windows Auth] Processing code:', code.substring(0, 5) + '...');
    
    // Exchange code for token
    const tokenUrl = 'https://oauth.battle.net/token';
    const clientId = process.env.BLIZZARD_CLIENT_ID;
    const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return res.status(500).send('Battle.net credentials not configured');
    }
    
    const redirectUri = 'https://guttakrutt.org/windows-callback';
    
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
    if (req.session) {
      req.session.passport = { user: user.id };
      
      req.session.save((err) => {
        if (err) {
          console.error('[Windows Auth] Session save error:', err);
          return res.status(500).send('Session error');
        }
        
        // Redirect to profile with success message
        console.log('[Windows Auth] Login successful, redirecting to homepage');
        res.redirect('/?login=success');
      });
    } else {
      res.status(500).send('Session not available');
    }
  } catch (error: any) {
    console.error('[Windows Auth] Error during callback:', error.response?.data || error.message);
    res.status(500).send(`Authentication error: ${error.message}`);
  }
});

// Simple logout
windowsAuthRouter.get('/logout', (req, res) => {
  console.log('[Windows Auth] Logout request');
  
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('[Windows Auth] Logout error:', err);
      }
      res.redirect('/');
    });
  } else {
    res.redirect('/');
  }
});