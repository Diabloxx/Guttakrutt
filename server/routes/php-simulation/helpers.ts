/**
 * Helper functions for PHP simulation endpoints
 * Provides common utilities for handling responses and logging
 */

import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { User } from '@shared/schema';
import { DatabaseStorage } from '../../DatabaseStorage';

/**
 * Storage interface with session support
 */
export interface StorageWithSession extends DatabaseStorage {
  sessionStore: any;
  verifyUserToken?: (userId: number, token: string) => Promise<boolean>;
  generateUserToken?: (userId: number, tokenValue?: string) => Promise<string>;
}

/**
 * Send a success response with standardized format
 */
export function sendSuccessResponse(
  res: Response, 
  data: any, 
  message: string = 'Success', 
  status: number = 200
) {
  return res.status(status).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}

/**
 * Send an error response with standardized format
 * @param res - The response object
 * @param error - Error message or Error object
 * @param status - HTTP status code
 * @param errorDetails - Additional error details (optional)
 */
export function sendErrorResponse(
  res: Response, 
  error: string | Error, 
  status: number = 400,
  errorDetails?: Record<string, any>
) {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return res.status(status).json({
    success: false,
    message: errorMessage,
    timestamp: new Date().toISOString(),
    ...(errorDetails || {}) // Spread any additional error details if provided
  });
}

/**
 * Send a redirect response
 */
export function sendRedirectResponse(
  res: Response,
  redirectUrl: string,
  message: string = 'Redirecting'
) {
  // Log the redirect
  logSimulation(`Redirecting to: ${redirectUrl}`);
  
  // For API calls, return a JSON response with redirect info
  if (redirectUrl.startsWith('/api/')) {
    return res.status(200).json({
      success: true,
      redirect: redirectUrl,
      message
    });
  }
  
  // For normal endpoints, do a proper HTTP redirect
  return res.redirect(redirectUrl);
}

/**
 * Log simulation information to console
 */
export function logSimulation(...args: any[]) {
  console.log('[PHP Simulation]', ...args);
}

/**
 * Get the current authenticated user from the request
 */
export function getCurrentUser(req: Request): User | undefined {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return undefined;
  }
  
  return req.user;
}

/**
 * Get Battle.net OAuth configuration
 */
export function getBattleNetConfig() {
  const clientId = process.env.BLIZZARD_CLIENT_ID;
  const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;
  const region = process.env.BATTLENET_REGION || 'eu';
  
  if (!clientId || !clientSecret) {
    throw new Error('Battle.net API credentials not configured');
  }
  
  return {
    clientId,
    clientSecret,
    region,
    authorizeURL: `https://oauth.battle.net/authorize`,
    tokenURL: `https://oauth.battle.net/token`,
  };
}

/**
 * Generate a direct authentication token for the user
 * This is used for Windows MySQL environment
 */
export async function generateDirectToken(userId: number, storage?: StorageWithSession): Promise<string> {
  // Generate a random token if one is not provided
  const randomToken = randomBytes(32).toString('hex');
  
  // Save to database using the storage method
  if (storage?.generateUserToken) {
    return storage.generateUserToken(userId, randomToken);
  }
  
  return randomToken;
}