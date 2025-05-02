/**
 * PHP Simulation: auth-user.php
 * Checks if user is authenticated via session
 * Works with both MySQL and PostgreSQL backends
 * Endpoint that the frontend auth-context uses to check authentication status
 */

import { Request, Response } from 'express';
import { sendSuccessResponse, sendErrorResponse, logSimulation, getCurrentUser } from './helpers';

/**
 * Get current user authentication status and user data
 * Works with browser session and provides compatibility with Windows MySQL environment
 */
export async function handleAuthUser(req: Request, res: Response) {
  try {
    logSimulation('Auth user endpoint called - checking authentication');
    
    // Check if user is authenticated
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      logSimulation('User is not authenticated');
      return res.json({
        authenticated: false,
        user: null,
        debug: process.env.NODE_ENV === 'development' ? {
          headers: req.headers,
          session: req.session,
          env: process.env.NODE_ENV,
        } : undefined
      });
    }
    
    // Get user data
    const user = req.user;
    
    if (!user) {
      logSimulation('Authenticated but no user data found');
      return sendErrorResponse(res, 'Authentication error: No user data found', 500);
    }
    
    // Format user data for response - support both PostgreSQL (camelCase) and MySQL (snake_case) formats
    const userData = {
      id: user.id,
      battleNetId: user.battleNetId || user.battle_net_id, 
      battleTag: user.battleTag || user.battle_tag,
      email: user.email,
      lastLogin: user.lastLogin || user.last_login,
      createdAt: user.createdAt || user.created_at,
      isGuildMember: user.isGuildMember || user.is_guild_member,
      isOfficer: user.isOfficer || user.is_officer,
      region: user.region,
      locale: user.locale,
      avatarUrl: user.avatarUrl || user.avatar_url
    };
    
    logSimulation('User is authenticated:', userData.battleTag);
    
    // Return user data with success flag
    return res.json({
      authenticated: true,
      user: userData,
      debug: process.env.NODE_ENV === 'development' ? {
        sessionID: req.sessionID,
        env: process.env.NODE_ENV,
      } : undefined
    });
  } catch (error) {
    logSimulation('Auth user error:', error);
    return sendErrorResponse(res, `Authentication check failed: ${error}`, 500);
  }
}

/**
 * Verify user authentication with direct token
 * For direct authentication in Windows MySQL environment
 */
export async function handleVerifyToken(req: Request, res: Response) {
  try {
    const { token, userId } = req.body;
    
    if (!token || !userId) {
      return sendErrorResponse(res, 'Missing token or userId', 400);
    }
    
    // Verify token
    const isValid = await req.app.locals.storage.verifyUserToken(userId, token);
    
    if (!isValid) {
      return sendErrorResponse(res, 'Invalid token', 401);
    }
    
    return sendSuccessResponse(res, { valid: true }, 'Token is valid');
  } catch (error) {
    return sendErrorResponse(res, `Token verification failed: ${error}`, 500);
  }
}