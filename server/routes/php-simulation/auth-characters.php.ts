/**
 * PHP Simulation: auth-characters.php
 * Handles fetching, linking, and setting main characters for the authenticated user
 * Works with both MySQL and PostgreSQL backends
 */

import { Request, Response, Router } from 'express';
import { sendSuccessResponse, sendErrorResponse, logSimulation, getCurrentUser } from './helpers';
import * as schema from '@shared/schema';

// Create a router for all character operations
export const handleAuthCharactersPhp = Router();

// Default GET handler - returns user's characters
handleAuthCharactersPhp.get('/', async (req: Request, res: Response) => {
  await handleGetUserCharacters(req, res);
});

// Get characters handler - redundant with the default but kept for compatibility
handleAuthCharactersPhp.get('/get-characters', async (req: Request, res: Response) => {
  await handleGetUserCharacters(req, res);
});

// Get main character
handleAuthCharactersPhp.get('/main', async (req: Request, res: Response) => {
  await handleGetMainCharacter(req, res);
});

// Set main character
handleAuthCharactersPhp.post('/main', async (req: Request, res: Response) => {
  await handleSetMainCharacter(req, res);
});

// Link character
handleAuthCharactersPhp.post('/link', async (req: Request, res: Response) => {
  await handleLinkCharacter(req, res);
});

// Fetch Battle.net characters - original path
handleAuthCharactersPhp.get('/fetch-bnet-characters', async (req: Request, res: Response) => {
  logSimulation('Fetch Battle.net characters endpoint called (fetch-bnet-characters path)');
  await handleFetchCharacters(req, res);
});

// Fetch Battle.net characters - path that matches client request
handleAuthCharactersPhp.get('/fetch', async (req: Request, res: Response) => {
  logSimulation('Fetch Battle.net characters endpoint called (fetch path)');
  await handleFetchCharacters(req, res);
});

// Helper function to handle character fetching
async function handleFetchCharacters(req: Request, res: Response) {
  try {
    logSimulation('Fetch Battle.net characters endpoint called');
    
    // Use cross-platform authentication check
    const user = await getCurrentUser(req);
    
    if (!user) {
      logSimulation('User is not authenticated');
      return sendErrorResponse(res, 'Authentication required', 401);
    }
    
    const userId = user.id;
    logSimulation(`Fetching Battle.net characters for user ID: ${userId}`);
    
    // Check token status if token expiry information is available
    if (user.tokenExpiry) {
      const tokenExpiry = new Date(user.tokenExpiry);
      const now = new Date();
      
      // If token is expired, inform the user to reauthenticate
      if (tokenExpiry < now) {
        logSimulation(`Token expired at ${tokenExpiry.toISOString()}, current time is ${now.toISOString()}`);
        return sendErrorResponse(res, 'Your Battle.net session has expired. Please log out and log in again.', 401);
      } else {
        logSimulation(`Token valid until ${tokenExpiry.toISOString()}`);
      }
    }
    
    try {
      // Call storage function to fetch and update characters from Battle.net
      logSimulation('Calling storage.fetchAndUpdateCharactersFromBattleNet...');
      const result = await req.app.locals.storage.fetchAndUpdateCharactersFromBattleNet(userId);
      
      if (!result.success) {
        logSimulation(`Character fetch failed: ${result.message}`);
        return sendErrorResponse(res, result.message || 'Failed to fetch characters from Battle.net', 500);
      }
      
      // Verify guild membership after fetching characters
      logSimulation('Verifying guild membership status...');
      const isGuildMember = await req.app.locals.storage.verifyGuildMembership(userId);
      logSimulation(`Guild membership verification result: ${isGuildMember}`);
      
      // Add guild membership status to result
      result.isGuildMember = isGuildMember;
      
      logSimulation(`Successfully fetched ${result.characters?.length || 0} characters, guild member: ${isGuildMember}`);
      return sendSuccessResponse(res, result, 'Successfully fetched characters from Battle.net');
    } catch (error: any) {
      logSimulation('Fetch Battle.net characters error:', error);
      
      // Handle specific Battle.net API errors
      if (error?.response?.status === 403 || error?.status === 403) {
        // 403 Forbidden usually means insufficient permissions (wow.profile scope missing)
        logSimulation('Battle.net API returned 403 Forbidden - insufficient permissions');
        
        // Check response data for error details
        const errorData = error?.response?.data || error?.data;
        logSimulation('Battle.net API error details:', errorData);
        
        // Use updated sendErrorResponse with correct parameter order
        return sendErrorResponse(
          res, 
          'Your Battle.net account does not have the necessary permissions. Please disconnect and reconnect your Battle.net account, ensuring you grant access to your World of Warcraft profile.', 
          403, 
          {
            error: 'insufficient_permissions',
            detail: errorData?.detail || 'Permission denied'
          }
        );
      }
      
      // Connection errors
      if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
        return sendErrorResponse(res, 'Could not connect to Battle.net servers. Please try again later.', 503);
      }
      
      // General error with improved formatting
      return sendErrorResponse(res, `Failed to fetch characters: ${error instanceof Error ? error.message : String(error)}`, 500);
    }
  } catch (error) {
    logSimulation('Unexpected error in fetch-bnet-characters endpoint:', error);
    return sendErrorResponse(res, `Server error: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
});

/**
 * Get user's characters (with verified status and main flag)
 * Enhanced to work with both PostgreSQL and MySQL backends and various auth methods
 */
export async function handleGetUserCharacters(req: Request, res: Response) {
  try {
    logSimulation('Get user characters endpoint called');
    
    // Try multiple authentication methods for cross-platform compatibility
    const user = await getCurrentUser(req);
    
    if (!user) {
      logSimulation('User is not authenticated');
      return sendErrorResponse(res, 'Authentication required', 401);
    }
    
    const userId = user.id;
    logSimulation(`Getting characters for user ID: ${userId}`);
    
    // Get characters from database
    const characters = await req.app.locals.storage.getUserCharacters(userId);
    
    // Log result summary (no sensitive data)
    logSimulation(`Retrieved ${characters?.length || 0} characters`);
    
    // Return standardized response
    return sendSuccessResponse(res, { 
      characters,
      count: characters?.length || 0
    });
  } catch (error) {
    logSimulation('Get user characters error:', error);
    return sendErrorResponse(res, `Failed to get characters: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
}

/**
 * Get user's main character
 * Enhanced to work with both PostgreSQL and MySQL backends and various auth methods
 */
export async function handleGetMainCharacter(req: Request, res: Response) {
  try {
    logSimulation('Get main character endpoint called');
    
    // Try multiple authentication methods for cross-platform compatibility
    const user = await getCurrentUser(req);
    
    if (!user) {
      logSimulation('User is not authenticated');
      return sendErrorResponse(res, 'Authentication required', 401);
    }
    
    const userId = user.id;
    logSimulation(`Getting main character for user ID: ${userId}`);
    
    // Get main character from database
    const character = await req.app.locals.storage.getUserMainCharacter(userId);
    
    if (!character) {
      logSimulation('No main character found');
      return sendSuccessResponse(res, { character: null }, 'No main character found');
    }
    
    // Log minimal info
    logSimulation(`Retrieved main character ${character.name}`);
    
    return sendSuccessResponse(res, { character });
  } catch (error) {
    logSimulation('Get main character error:', error);
    return sendErrorResponse(res, `Failed to get main character: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
}

/**
 * Set a character as the user's main character
 * Enhanced to work with both PostgreSQL and MySQL backends and various auth methods
 */
export async function handleSetMainCharacter(req: Request, res: Response) {
  try {
    logSimulation('Set main character endpoint called');
    
    // Try multiple authentication methods for cross-platform compatibility
    const user = await getCurrentUser(req);
    
    if (!user) {
      logSimulation('User is not authenticated');
      return sendErrorResponse(res, 'Authentication required', 401);
    }
    
    const userId = user.id;
    const { characterId } = req.body;
    
    if (!userId || !characterId) {
      return sendErrorResponse(res, 'Invalid user ID or character ID', 400);
    }
    
    logSimulation(`Setting main character ${characterId} for user ID: ${userId}`);
    
    // Check if user owns this character
    const isOwned = await req.app.locals.storage.userOwnsCharacter(userId, characterId);
    
    if (!isOwned) {
      logSimulation(`User ${userId} does not own character ${characterId}`);
      return sendErrorResponse(res, 'You do not own this character', 403);
    }
    
    // Set as main character
    const success = await req.app.locals.storage.setMainCharacter(userId, characterId);
    
    if (!success) {
      logSimulation(`Failed to set main character for user ${userId}`);
      return sendErrorResponse(res, 'Failed to set main character', 500);
    }
    
    logSimulation(`Successfully set main character ${characterId} for user ${userId}`);
    return sendSuccessResponse(res, { success: true }, 'Main character set successfully');
  } catch (error) {
    logSimulation('Set main character error:', error);
    return sendErrorResponse(res, `Failed to set main character: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
}

/**
 * Link a character to the user
 * Enhanced to work with both PostgreSQL and MySQL backends and various auth methods
 */
export async function handleLinkCharacter(req: Request, res: Response) {
  try {
    logSimulation('Link character endpoint called');
    
    // Try multiple authentication methods for cross-platform compatibility
    const user = await getCurrentUser(req);
    
    if (!user) {
      logSimulation('User is not authenticated');
      return sendErrorResponse(res, 'Authentication required', 401);
    }
    
    const userId = user.id;
    const { characterId, verified = false } = req.body;
    
    if (!userId || !characterId) {
      return sendErrorResponse(res, 'Invalid user ID or character ID', 400);
    }
    
    logSimulation(`Linking character ${characterId} to user ID: ${userId}`);
    
    // Check if character exists
    const character = await req.app.locals.storage.getCharacter(characterId);
    
    if (!character) {
      logSimulation(`Character ${characterId} not found`);
      return sendErrorResponse(res, 'Character not found', 404);
    }
    
    // Link character to user
    const linkData: schema.InsertUserCharacter = {
      userId,
      characterId,
      verified,
      isMain: false
    };
    
    logSimulation(`Linking character ${character.name} (${characterId}) to user ${userId}`);
    const userCharacter = await req.app.locals.storage.linkCharacterToUser(linkData);
    
    logSimulation(`Successfully linked character to user`);
    return sendSuccessResponse(res, { userCharacter }, 'Character linked successfully');
  } catch (error) {
    logSimulation('Link character error:', error);
    return sendErrorResponse(res, `Failed to link character: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
}