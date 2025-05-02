/**
 * PHP Simulation: auth-direct-check.php
 * Direct token authentication endpoint for Windows MySQL environment
 * Used for verifying and generating direct auth tokens
 */

import { Request, Response } from 'express';
import { sendSuccessResponse, sendErrorResponse, sendRedirectResponse, logSimulation, generateDirectToken } from './helpers';

/**
 * Handle direct token generation (POST request)
 * This is used when Windows MySQL environment needs a direct auth token
 */
export async function handleDirectTokenGeneration(req: Request, res: Response) {
  try {
    logSimulation('Direct token generation endpoint called');
    
    // Check if user is authenticated through Battle.net OAuth
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      logSimulation('User is not authenticated for token generation');
      return sendErrorResponse(res, 'Authentication required', 401);
    }
    
    const userId = req.user?.id;
    
    if (!userId) {
      return sendErrorResponse(res, 'Invalid user ID', 400);
    }
    
    // Generate a token for this user
    const token = await generateDirectToken(userId);
    
    // Return the token
    return sendSuccessResponse(
      res, 
      { 
        userId,
        token,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }, 
      'Direct authentication token generated'
    );
  } catch (error) {
    logSimulation('Direct token generation error:', error);
    return sendErrorResponse(res, `Failed to generate token: ${error}`, 500);
  }
}

/**
 * Handle direct token verification (GET request)
 * This is used by Windows MySQL environment to verify a token is valid
 */
export async function handleDirectTokenVerification(req: Request, res: Response) {
  try {
    logSimulation('Direct token verification endpoint called');
    
    const { token, userId } = req.query;
    
    if (!token || !userId) {
      return sendErrorResponse(res, 'Missing token or userId', 400);
    }
    
    // Verify token
    const isValid = await req.app.locals.storage.verifyUserToken(
      Number(userId), 
      token.toString()
    );
    
    if (!isValid) {
      return sendErrorResponse(res, 'Invalid token', 401);
    }
    
    // If token is valid, send back success
    return sendSuccessResponse(
      res, 
      { valid: true, userId: Number(userId) }, 
      'Token is valid'
    );
  } catch (error) {
    logSimulation('Direct token verification error:', error);
    return sendErrorResponse(res, `Token verification failed: ${error}`, 500);
  }
}

/**
 * Handle direct login attempt (POST with form data)
 * This is used by Windows MySQL environment to log in with form submission
 */
export async function handleDirectFormLogin(req: Request, res: Response) {
  try {
    logSimulation('Direct form login endpoint called');
    
    const { token, userId, redirectUrl } = req.body;
    
    if (!token || !userId) {
      return sendErrorResponse(res, 'Missing token or userId', 400);
    }
    
    // Verify token
    const isValid = await req.app.locals.storage.verifyUserToken(
      Number(userId), 
      token.toString()
    );
    
    if (!isValid) {
      return sendErrorResponse(res, 'Invalid token or expired session', 401);
    }
    
    // Log the user in using their Battle.net ID
    const user = await req.app.locals.storage.getUserById(Number(userId));
    
    if (!user) {
      return sendErrorResponse(res, 'User not found', 404);
    }
    
    // Login the user using the session
    req.login(user, (err) => {
      if (err) {
        logSimulation('Error logging in user with direct token:', err);
        return sendErrorResponse(res, `Login error: ${err}`, 500);
      }
      
      // Generate a new token to extend the session
      req.app.locals.storage.generateUserToken(user.id, token.toString())
        .catch(error => {
          logSimulation('Error regenerating token:', error);
        });
      
      // Redirect to the requested URL or homepage
      const redirectTo = redirectUrl || '/';
      logSimulation('Redirect after direct auth to:', redirectTo);
      
      return sendRedirectResponse(res, redirectTo, 'Login successful');
    });
  } catch (error) {
    logSimulation('Direct login form error:', error);
    return sendErrorResponse(res, `Login failed: ${error}`, 500);
  }
}