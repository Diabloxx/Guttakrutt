/**
 * Routes for fetching and managing Battle.net character data
 */
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { storage } from '../storage';
import { Session } from 'express-session';

// Extend the Session interface to include the user property
declare module 'express-session' {
  interface Session {
    user?: any;
    authenticated?: boolean;
  }
}

const router = Router();

// Get the characters from Battle.net API for the authenticated user
router.get('/fetch-bnet-characters', async (req, res) => {
  try {
    // Log session information for debugging
    console.log('Session info:', {
      hasSession: !!req.session,
      sessionID: req.sessionID,
      hasUser: !!req.session?.user,
      hasPassport: !!req.session?.passport,
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false
    });
    
    // Enhanced authentication check to handle all types of sessions
    console.log('Checking authentication status for character API request');
    console.log('Session debug info:', {
      hasSession: !!req.session,
      hasPassport: !!(req.session?.passport),
      passportUser: req.session?.passport?.user,
      sessionUser: !!req.session?.user,
      isAuthenticatedMethod: !!(req.isAuthenticated && req.isAuthenticated()),
      hasReqUser: !!req.user
    });
    
    const isAuthenticated = (req.isAuthenticated && req.isAuthenticated()) || 
                           (req.session?.passport && req.session.passport.user) ||
                           !!req.session?.user ||
                           !!req.user;
    
    if (!isAuthenticated) {
      console.log('User not authenticated for character API request');
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to fetch characters',
        debug: {
          hasSession: !!req.session,
          hasPassport: !!(req.session?.passport),
          passportUser: req.session?.passport?.user ? 'present' : 'missing', 
          sessionUser: !!req.session?.user ? 'present' : 'missing',
          isAuthenticated: !!(req.isAuthenticated && req.isAuthenticated())
        }
      });
    }
    
    console.log('User is authenticated for character API request');
    
    // Get the user ID either from passport or from session.user
    let userId, accessToken, region;
    
    if (req.user) {
      // If Passport has populated req.user, use that
      userId = req.user.id;
      accessToken = req.user.accessToken;
      region = req.user.region || 'eu';
      console.log('Using passport user data');
    } else if (req.session?.passport?.user) {
      // If we have a passport user ID in session, fetch the user
      userId = req.session.passport.user;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found, please log in again',
        });
      }
      accessToken = user.accessToken;
      region = user.region || 'eu';
      console.log('Using session passport data');
    } else if (req.session?.user) {
      // Fall back to session.user if it exists
      userId = req.session.user.id;
      accessToken = req.session.user.accessToken;
      region = req.session.user.region || 'eu';
      console.log('Using session.user data');
    } else {
      // This shouldn't happen due to the isAuthenticated check above, but just in case
      return res.status(401).json({
        success: false,
        message: 'Authentication data is missing',
      });
    }
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in session',
      });
    }
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'No Battle.net access token available. Please connect your Battle.net account first.',
      });
    }
    
    console.log(`Fetching characters for user ${userId} from Battle.net API`);
    
    // Call Battle.net API to get user's WoW characters
    const response = await axios.get(`https://${region}.api.blizzard.com/profile/user/wow`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });
    
    // Extract character data from response
    const wowAccountData = response.data?.wow_accounts || [];
    let fetchedCharacters = [];
    
    // Process the character data from all WoW accounts
    for (const account of wowAccountData) {
      const accountCharacters = account.characters || [];
      for (const character of accountCharacters) {
        // Normalize the character data to match our schema
        // Handle both the API response structure and localized names
        try {
          // Extract realm data with proper fallbacks
          let realmName = '';
          let realmSlug = '';
          
          if (character.realm) {
            if (typeof character.realm === 'string') {
              realmName = character.realm;
            } else if (character.realm.name) {
              // Handle localized name fields
              if (typeof character.realm.name === 'string') {
                realmName = character.realm.name;
              } else if (typeof character.realm.name === 'object') {
                // Try various locales with fallbacks
                realmName = character.realm.name.en_GB || 
                           character.realm.name.en_US || 
                           character.realm.name.en || 
                           Object.values(character.realm.name)[0] || 
                           'Unknown Realm';
              }
            }
            
            // Get slug if available
            realmSlug = character.realm.slug || '';
          }
          
          // Extract class data with proper fallbacks
          let className = '';
          if (character.playable_class) {
            if (typeof character.playable_class === 'string') {
              className = character.playable_class;
            } else if (character.playable_class.name) {
              // Handle localized name fields
              if (typeof character.playable_class.name === 'string') {
                className = character.playable_class.name;
              } else if (typeof character.playable_class.name === 'object') {
                // Try various locales with fallbacks
                className = character.playable_class.name.en_GB || 
                           character.playable_class.name.en_US || 
                           character.playable_class.name.en || 
                           Object.values(character.playable_class.name)[0] || 
                           'Unknown Class';
              }
            }
          }
          
          // Extract faction data with proper fallbacks
          let factionName = '';
          if (character.faction) {
            if (typeof character.faction === 'string') {
              factionName = character.faction;
            } else if (character.faction.name) {
              // Handle localized name fields
              if (typeof character.faction.name === 'string') {
                factionName = character.faction.name;
              } else if (typeof character.faction.name === 'object') {
                // Try various locales with fallbacks
                factionName = character.faction.name.en_GB || 
                             character.faction.name.en_US || 
                             character.faction.name.en || 
                             Object.values(character.faction.name)[0] || 
                             character.faction.type || 
                             'Unknown Faction';
              }
            } else if (character.faction.type) {
              factionName = character.faction.type;
            }
          }
          
          // Extract race data with proper fallbacks
          let raceName = '';
          if (character.playable_race) {
            if (typeof character.playable_race === 'string') {
              raceName = character.playable_race;
            } else if (character.playable_race.name) {
              // Handle localized name fields
              if (typeof character.playable_race.name === 'string') {
                raceName = character.playable_race.name;
              } else if (typeof character.playable_race.name === 'object') {
                // Try various locales with fallbacks
                raceName = character.playable_race.name.en_GB || 
                          character.playable_race.name.en_US || 
                          character.playable_race.name.en || 
                          Object.values(character.playable_race.name)[0] || 
                          'Unknown Race';
              }
            }
          }
          
          fetchedCharacters.push({
            name: character.name,
            realm: realmName,
            class: className,
            level: character.level || 0,
            // Added this to avoid confusion when a character has the same name on different realms
            realmSlug: realmSlug,
            // Additional fields from the API
            characterId: character.id,
            faction: factionName,
            race: raceName,
            gender: character.gender?.name || character.gender?.type || '',
          });
          
          console.log(`Processed character: ${character.name} on ${realmName}`);
        } catch (charError) {
          console.error('Error processing character data:', charError);
          console.error('Problem character data:', JSON.stringify(character));
        }
      }
    }
    
    console.log(`Found ${fetchedCharacters.length} characters for user ${userId}`);
    
    // Store the characters in the database and link them to the user
    const linkedCharacters = await Promise.all(fetchedCharacters.map(async (character) => {
      try {
        // For simplicity, we'll just create new characters
        // Since we don't have a convenient method to find by name and realm
        let characterId;
        const characterName = character.name;
        const characterRealm = character.realm;
        
        // We'll always create a new character for now
        // This path won't execute since we don't search for existing characters
        if (false) {
          // This code is unreachable but kept for future reference
          const fakeId = 0; // Just to satisfy TypeScript
          await storage.updateCharacter(fakeId, {
            level: character.level,
            class: character.class,
            // Additional fields as needed
          });
        } else {
          // Create new character
          const newCharacter = await storage.createCharacter({
            name: character.name,
            realm: character.realm,
            class: character.class,
            level: character.level,
            // Additional fields as needed
            faction: character.faction,
            race: character.race,
          });
          characterId = newCharacter.id;
        }
        
        // Link character to user if not already linked
        const isLinked = await storage.userOwnsCharacter(userId, characterId);
        if (!isLinked) {
          await storage.linkCharacterToUser({
            userId,
            characterId,
            isMain: false, // Not automatically setting as main
            verified: true, // Auto-verify Battle.net characters
            verifiedAt: new Date(),
          });
        }
        
        return {
          id: characterId,
          name: character.name,
          realm: character.realm,
          class: character.class,
          level: character.level,
          // Additional fields as needed
        };
      } catch (error) {
        console.error(`Error processing character ${character.name}-${character.realm}:`, error);
        return null;
      }
    }));
    
    // Filter out any null values from errors
    const successfullyLinkedCharacters = linkedCharacters.filter(Boolean);
    
    // Verify guild membership after fetching characters
    console.log('Verifying guild membership status for user ID:', userId);
    const isGuildMember = await storage.verifyGuildMembership(userId);
    console.log(`Guild membership verification result: ${isGuildMember}`);
    
    return res.status(200).json({
      success: true,
      message: `Successfully fetched and linked ${successfullyLinkedCharacters.length} characters`,
      characters: successfullyLinkedCharacters,
      isGuildMember: isGuildMember,
    });
  } catch (err) {
    const error = err as any;
    console.error('Error fetching Battle.net characters:', error);
    
    // Special handling for token expiration (401 Unauthorized)
    if (error.response?.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Battle.net token expired. Please reconnect your Battle.net account.',
        error: 'token_expired',
      });
    }
    
    // Special handling for permission issues (403 Forbidden)
    if (error.response?.status === 403) {
      console.error('Battle.net API returned 403 Forbidden - insufficient permissions');
      console.error('Error details:', error.response?.data);
      
      // Check if the token has the correct scopes
      return res.status(403).json({
        success: false,
        message: 'Your Battle.net account does not have the necessary permissions. Please disconnect and reconnect your Battle.net account, ensuring you grant the "wow.profile" scope.',
        error: 'insufficient_permissions',
        detail: error.response?.data?.detail || 'Permission denied',
      });
    }
    
    // Network or connection issues
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({
        success: false,
        message: 'Could not connect to Battle.net servers. Please try again later.',
        error: 'connection_error',
      });
    }
    
    // General error case
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching Battle.net characters',
      error: error.message || 'Unknown error',
    });
  }
});

// Get the characters linked to the authenticated user
router.get('/', async (req, res) => {
  try {
    // Log session information for debugging
    console.log('Get characters session info:', {
      hasSession: !!req.session,
      sessionID: req.sessionID,
      hasUser: !!req.session?.user,
      hasPassport: !!req.session?.passport,
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false
    });
    
    // Enhanced authentication check to handle all types of sessions
    console.log('Checking authentication status for getUserCharacters request');
    console.log('Session debug info:', {
      hasSession: !!req.session,
      hasPassport: !!(req.session?.passport),
      passportUser: req.session?.passport?.user,
      sessionUser: !!req.session?.user,
      isAuthenticatedMethod: !!(req.isAuthenticated && req.isAuthenticated()),
      hasReqUser: !!req.user
    });
    
    const isAuthenticated = (req.isAuthenticated && req.isAuthenticated()) || 
                           (req.session?.passport && req.session.passport.user) ||
                           !!req.session?.user ||
                           !!req.user;
    
    if (!isAuthenticated) {
      console.log('User not authenticated for getUserCharacters request');
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to view your characters',
        debug: {
          hasSession: !!req.session,
          hasPassport: !!(req.session?.passport),
          passportUser: req.session?.passport?.user ? 'present' : 'missing', 
          sessionUser: !!req.session?.user ? 'present' : 'missing',
          isAuthenticated: !!(req.isAuthenticated && req.isAuthenticated())
        }
      });
    }
    
    console.log('User is authenticated for getUserCharacters request');
    
    // Get the user ID either from passport or from session.user
    let userId;
    
    if (req.user) {
      // If Passport has populated req.user, use that
      userId = req.user.id;
      console.log('Using passport user data for characters endpoint');
    } else if (req.session?.passport?.user) {
      // If we have a passport user ID in session, use that
      userId = req.session.passport.user;
      console.log('Using session passport data for characters endpoint');
    } else if (req.session?.user) {
      // Fall back to session.user if it exists
      userId = req.session.user.id;
      console.log('Using session.user data for characters endpoint');
    }
    
    if (!userId) {
      console.error('User ID missing in session');
      return res.status(400).json({
        success: false,
        message: 'Invalid user session data',
        data: {
          characters: [],
        },
      });
    }
    
    try {
      // Get user's characters from the database
      const characters = await storage.getUserCharacters(userId);
      
      // Get guild membership status
      const user = await storage.getUser(userId);
      
      return res.status(200).json({
        success: true,
        data: {
          characters: characters || [],
          isGuildMember: user?.isGuildMember || false,
        },
      });
    } catch (dbError) {
      console.error('Database error getting user characters:', dbError);
      // Return empty array instead of error to avoid UI breakage
      return res.status(200).json({
        success: true,
        data: {
          characters: [],
          isGuildMember: false
        },
        debug: {
          message: 'Error fetching characters, showing empty list',
          error: dbError instanceof Error ? dbError.message : String(dbError),
        },
      });
    }
  } catch (err) {
    const error = err as any;
    console.error('Error getting user characters:', error);
    
    // Return empty array with success true to avoid UI breakage
    return res.status(200).json({
      success: true,
      data: {
        characters: [],
        isGuildMember: false
      },
      debug: {
        message: 'Error in character endpoint',
        error: error.message || 'Unknown error',
      },
    });
  }
});

// Set a character as the user's main character
router.post('/main', async (req, res) => {
  try {
    // Log session information for debugging
    console.log('Set main character session info:', {
      hasSession: !!req.session,
      sessionID: req.sessionID,
      hasUser: !!req.session?.user,
      hasPassport: !!req.session?.passport,
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false
    });
    
    // Enhanced authentication check to handle all types of sessions
    console.log('Checking authentication status for setMainCharacter request');
    console.log('Session debug info:', {
      hasSession: !!req.session,
      hasPassport: !!(req.session?.passport),
      passportUser: req.session?.passport?.user,
      sessionUser: !!req.session?.user,
      isAuthenticatedMethod: !!(req.isAuthenticated && req.isAuthenticated()),
      hasReqUser: !!req.user
    });
    
    const isAuthenticated = (req.isAuthenticated && req.isAuthenticated()) || 
                           (req.session?.passport && req.session.passport.user) ||
                           !!req.session?.user ||
                           !!req.user;
    
    if (!isAuthenticated) {
      console.log('User not authenticated for setMainCharacter request');
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to set a main character',
        debug: {
          hasSession: !!req.session,
          hasPassport: !!(req.session?.passport),
          passportUser: req.session?.passport?.user ? 'present' : 'missing', 
          sessionUser: !!req.session?.user ? 'present' : 'missing',
          isAuthenticated: !!(req.isAuthenticated && req.isAuthenticated())
        }
      });
    }
    
    console.log('User is authenticated for setMainCharacter request');
    
    // Get the user ID either from passport or from session.user
    let userId;
    
    if (req.user) {
      // If Passport has populated req.user, use that
      userId = req.user.id;
      console.log('Using passport user data for main character endpoint');
    } else if (req.session?.passport?.user) {
      // If we have a passport user ID in session, use that
      userId = req.session.passport.user;
      console.log('Using session passport data for main character endpoint');
    } else if (req.session?.user) {
      // Fall back to session.user if it exists
      userId = req.session.user.id;
      console.log('Using session.user data for main character endpoint');
    }
    
    if (!userId) {
      console.error('User ID missing in session');
      return res.status(400).json({
        success: false,
        message: 'Invalid user session data',
      });
    }
    const { characterId } = req.body;
    
    if (!characterId) {
      return res.status(400).json({
        success: false,
        message: 'Character ID is required',
      });
    }
    
    // Verify that the user owns this character
    const ownsCharacter = await storage.userOwnsCharacter(userId, characterId);
    
    if (!ownsCharacter) {
      return res.status(403).json({
        success: false,
        message: 'You do not own this character',
      });
    }
    
    // Set the character as main
    const success = await storage.setMainCharacter(userId, characterId);
    
    if (success) {
      return res.status(200).json({
        success: true,
        message: 'Main character set successfully',
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to set main character',
      });
    }
  } catch (err) {
    const error = err as any;
    console.error('Error setting main character:', error);
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred while setting main character',
      error: error.message || 'Unknown error',
    });
  }
});

// Link a character to the user's account
router.post('/link', async (req, res) => {
  try {
    // Log session information for debugging
    console.log('Link character session info:', {
      hasSession: !!req.session,
      sessionID: req.sessionID,
      hasUser: !!req.session?.user,
      hasPassport: !!req.session?.passport,
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false
    });
    
    // Enhanced authentication check to handle all types of sessions
    console.log('Checking authentication status for linkCharacter request');
    console.log('Session debug info:', {
      hasSession: !!req.session,
      hasPassport: !!(req.session?.passport),
      passportUser: req.session?.passport?.user,
      sessionUser: !!req.session?.user,
      isAuthenticatedMethod: !!(req.isAuthenticated && req.isAuthenticated()),
      hasReqUser: !!req.user
    });
    
    const isAuthenticated = (req.isAuthenticated && req.isAuthenticated()) || 
                           (req.session?.passport && req.session.passport.user) ||
                           !!req.session?.user ||
                           !!req.user;
    
    if (!isAuthenticated) {
      console.log('User not authenticated for linkCharacter request');
      return res.status(401).json({
        success: false,
        message: 'You must be logged in to link a character',
        debug: {
          hasSession: !!req.session,
          hasPassport: !!(req.session?.passport),
          passportUser: req.session?.passport?.user ? 'present' : 'missing', 
          sessionUser: !!req.session?.user ? 'present' : 'missing',
          isAuthenticated: !!(req.isAuthenticated && req.isAuthenticated())
        }
      });
    }
    
    console.log('User is authenticated for linkCharacter request');
    
    // Get the user ID either from passport or from session.user
    let userId;
    
    if (req.user) {
      // If Passport has populated req.user, use that
      userId = req.user.id;
      console.log('Using passport user data for link character endpoint');
    } else if (req.session?.passport?.user) {
      // If we have a passport user ID in session, use that
      userId = req.session.passport.user;
      console.log('Using session passport data for link character endpoint');
    } else if (req.session?.user) {
      // Fall back to session.user if it exists
      userId = req.session.user.id;
      console.log('Using session.user data for link character endpoint');
    }
    
    if (!userId) {
      console.error('User ID missing in session');
      return res.status(400).json({
        success: false,
        message: 'Invalid user session data',
      });
    }
    const { characterId, verified = false } = req.body;
    
    if (!characterId) {
      return res.status(400).json({
        success: false,
        message: 'Character ID is required',
      });
    }
    
    // Check if the character exists
    const character = await storage.getCharacter(characterId);
    
    if (!character) {
      return res.status(404).json({
        success: false,
        message: 'Character not found',
      });
    }
    
    // Check if the character is already linked to this user
    const isLinked = await storage.userOwnsCharacter(userId, characterId);
    
    if (isLinked) {
      return res.status(400).json({
        success: false,
        message: 'Character is already linked to your account',
      });
    }
    
    // Link the character to the user
    const linkData = await storage.linkCharacterToUser({
      userId,
      characterId,
      isMain: false,
      verified,
      verifiedAt: verified ? new Date() : null,
    });
    
    return res.status(200).json({
      success: true,
      message: 'Character linked successfully',
      data: linkData,
    });
  } catch (err) {
    const error = err as any;
    console.error('Error linking character:', error);
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred while linking character',
      error: error.message || 'Unknown error',
    });
  }
});

export default router;