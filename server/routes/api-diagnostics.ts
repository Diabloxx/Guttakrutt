import express, { Request, Response } from 'express';
import axios from 'axios';
import { storage } from '../storage';

export const router = express.Router();

// This endpoint is for diagnostic purposes only
// It will return the raw Battle.net API response data for authenticated users
router.get('/bnet-api', async (req: Request, res: Response) => {
  try {
    // Ensure the user is authenticated
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get the current user
    const user: any = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No user found in request'
      });
    }

    // We need an access token to call the Battle.net API
    if (!user.accessToken) {
      return res.status(400).json({
        success: false,
        message: 'No Battle.net access token available for this user',
        user: {
          id: user.id,
          battleTag: user.battleTag,
          hasBattleNetId: !!user.battleNetId
        }
      });
    }

    // Make the API call to get the user data
    try {
      console.log('[Diagnostics] Fetching Battle.net user data');
      
      // Determine the region to use (default to EU if not specified in user data)
      const region = (user.region || 'eu').toLowerCase();
      console.log(`[Diagnostics] Using region: ${region}`);
      
      const results: any = {
        success: true,
        // User information from our database
        currentUser: {
          id: user.id,
          username: user.username,
          battleTag: user.battleTag,
          battleNetId: user.battleNetId,
          region: user.region || 'eu',
          locale: user.locale
        },
        // Session and token info
        auth: {
          tokenExpiry: user.tokenExpiry || null,
          hasValidToken: user.accessToken && Date.now() < (new Date(user.tokenExpiry || 0)).getTime()
        },
        responses: {},
        // Detailed analysis of case-sensitive field checks
        fieldAnalysis: {
          caseSensitiveFields: []
        }
      };
      
      // First, get the user info from Battle.net (OpenID)
      try {
        const userResponse = await axios.get(`https://${region}.battle.net/oauth/userinfo`, {
          headers: {
            'Authorization': `Bearer ${user.accessToken}`
          }
        });
        
        results.responses.userInfo = {
          status: userResponse.status,
          headers: userResponse.headers,
          data: userResponse.data
        };
        
        // If we have a battletag in the response, update the currentUser
        if (userResponse.data && userResponse.data.battletag) {
          results.currentUser.battleTag = userResponse.data.battletag;
          
          // Update the user in the database if the tag from Battle.net is different
          if (user.battleTag !== userResponse.data.battletag && 
              userResponse.data.battletag !== 'Unknown#0000') {
            console.log(`[Diagnostics] Updating user's BattleTag from '${user.battleTag}' to '${userResponse.data.battletag}'`);
            
            try {
              await storage.updateUser(user.id, {
                battleTag: userResponse.data.battletag,
                battle_tag: userResponse.data.battletag // For MySQL compatibility
              });
              console.log(`[Diagnostics] Successfully updated user's BattleTag in the database`);
            } catch (updateError) {
              console.error('[Diagnostics] Error updating user BattleTag:', updateError);
            }
          }
        }
        
        results.analysis = {
          userInfoKeys: Object.keys(userResponse.data)
        };
        
        // Check for important fields with case sensitivity
        const casePatterns: Array<{ pattern: RegExp, keys: Array<{ exactFieldName: string, value: any }> }> = [
          { pattern: /battletag/i, keys: [] },
          { pattern: /battle_?tag/i, keys: [] },
          { pattern: /id/i, keys: [] },
          { pattern: /sub/i, keys: [] }
        ];
        
        // Analyze the response data fields with case sensitivity
        for (const field of Object.keys(userResponse.data)) {
          for (const pattern of casePatterns) {
            if (pattern.pattern.test(field)) {
              pattern.keys.push({
                exactFieldName: field,
                value: userResponse.data[field]
              });
            }
          }
        }
        
        // Add the case analysis results
        results.fieldAnalysis.caseSensitiveFields = casePatterns;
      } catch (userInfoError: any) {
        results.responses.userInfo = {
          error: userInfoError.message,
          response: userInfoError.response ? {
            status: userInfoError.response.status,
            data: userInfoError.response.data
          } : null
        };
      }
      
      // Get user's characters (WoW API)
      try {
        const charactersResponse = await axios.get(`https://${region}.api.blizzard.com/profile/user/wow`, {
          headers: {
            'Authorization': `Bearer ${user.accessToken}`,
            'Battlenet-Namespace': `profile-${region}`
          }
        });
        
        results.responses.charactersInfo = {
          status: charactersResponse.status,
          data: charactersResponse.data
        };
        
        if (!results.analysis) {
          results.analysis = {};
        }
        
        results.analysis.characterInfoKeys = Object.keys(charactersResponse.data);
        
        // Extract realm and character info for diagnostic purposes
        if (charactersResponse.data.wow_accounts && 
            Array.isArray(charactersResponse.data.wow_accounts) && 
            charactersResponse.data.wow_accounts.length > 0) {
          
          const characterSummary = [];
          
          console.log(`[Diagnostics] Found ${charactersResponse.data.wow_accounts.length} WoW accounts`);
          
          for (const account of charactersResponse.data.wow_accounts) {
            if (account.characters && Array.isArray(account.characters)) {
              console.log(`[Diagnostics] Processing account with ${account.characters.length} characters`);
              
              for (const character of account.characters) {
                try {
                  // Safely extract multilingual or nested fields
                  const getLocalizedName = (obj: any): string => {
                    if (!obj) return 'Unknown';
                    if (typeof obj === 'string') return obj;
                    if (obj.name) {
                      // Handle localized names
                      if (typeof obj.name === 'string') return obj.name;
                      // Try different locale variants
                      for (const locale of ['en_GB', 'en_US', 'en']) {
                        if (obj.name[locale]) return obj.name[locale];
                      }
                      // Last resort, take any available locale
                      const firstLocale = Object.keys(obj.name)[0];
                      if (firstLocale) return obj.name[firstLocale];
                    }
                    return 'Unknown';
                  };
                  
                  // Get the realm name
                  let realmName = 'Unknown Realm';
                  if (character.realm) {
                    realmName = getLocalizedName(character.realm);
                  }
                  
                  // Get class name
                  let className = 'Unknown Class';
                  if (character.playable_class) {
                    className = getLocalizedName(character.playable_class);
                  } else if (character.class) {
                    className = typeof character.class === 'string' ? character.class : 'Unknown Class';
                  }
                  
                  // Get race name
                  let raceName = 'Unknown Race';
                  if (character.playable_race) {
                    raceName = getLocalizedName(character.playable_race);
                  } else if (character.race) {
                    raceName = typeof character.race === 'string' ? character.race : 'Unknown Race';
                  }
                  
                  // Get faction if available
                  let faction = character.faction?.type || 'NEUTRAL';
                  
                  // Create a clean character object with all necessary fields
                  const cleanCharacter = {
                    name: character.name || 'Unknown',
                    level: character.level || 0,
                    realm: realmName,
                    class: className,
                    race: raceName,
                    faction: faction
                  };
                  
                  console.log(`[Diagnostics] Processed character: ${cleanCharacter.name} (${cleanCharacter.level} ${cleanCharacter.race} ${cleanCharacter.class})`);
                  characterSummary.push(cleanCharacter);
                } catch (charError) {
                  console.error('[Diagnostics] Error processing character:', charError);
                  // Still include basic character info even if error
                  characterSummary.push({
                    name: character.name || 'Unknown',
                    level: character.level || 0,
                    realm: 'Error',
                    class: 'Error',
                    race: 'Error'
                  });
                }
              }
            }
          }
          
          console.log(`[Diagnostics] Processed ${characterSummary.length} characters total`);
          results.characterSummary = characterSummary;
          
          // After getting characters, verify the user's guild membership status
          try {
            console.log(`[Diagnostics] Verifying guild membership for user ID: ${user.id}`);
            const isGuildMember = await storage.verifyGuildMembership(user.id);
            console.log(`[Diagnostics] Guild membership verification result: ${isGuildMember}`);
            
            // Important: Actually update the user record with the verification result
            console.log(`[Diagnostics] Updating user ${user.id} with guild membership status: ${isGuildMember}`);
            await storage.updateUser(user.id, { 
              isGuildMember: isGuildMember,
              is_guild_member: isGuildMember // For MySQL compatibility
            });
            
            // Update the local user object so it's reflected in the current session
            user.isGuildMember = isGuildMember;
            user.is_guild_member = isGuildMember;
            
            results.isGuildMember = isGuildMember;
            results.userUpdated = true;
          } catch (verifyError: any) {
            console.error('[Diagnostics] Error verifying guild membership:', verifyError);
            results.verifyGuildMembershipError = verifyError.message || String(verifyError);
          }
        }
      } catch (charactersError: any) {
        results.responses.charactersInfo = {
          error: charactersError.message,
          response: charactersError.response ? {
            status: charactersError.response.status,
            data: charactersError.response.data
          } : null
        };
      }
      
      // Return all the compiled diagnostic data
      return res.status(200).json(results);
    } catch (apiError: any) {
      // Handle API errors
      return res.status(500).json({
        success: false,
        message: 'Battle.net API error',
        error: apiError.message,
        response: apiError.response ? {
          status: apiError.response.status,
          data: apiError.response.data
        } : null
      });
    }
  } catch (error: any) {
    console.error('[Diagnostics] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Test endpoint that directly calls the PHP simulation
router.get('/auth-callback-test', async (req: Request, res: Response) => {
  try {
    // This endpoint will attempt to call the auth-callback.php endpoint with test data
    // to analyze how it processes the response
    
    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only available in development mode'
      });
    }
    
    // Create a test code and state
    const code = 'test_code_' + Date.now();
    const state = 'test_state_' + Date.now();
    
    // Call the endpoint using axios
    try {
      const response = await axios.get(`http://localhost:${process.env.PORT || 5000}/auth-callback.php`, {
        params: {
          code,
          state,
          test: true
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Test completed',
        response: {
          status: response.status,
          headers: response.headers,
          data: response.data
        }
      });
    } catch (callbackError: any) {
      return res.status(500).json({
        success: false,
        message: 'Error calling auth-callback.php',
        error: callbackError.message,
        response: callbackError.response ? {
          status: callbackError.response.status,
          data: callbackError.response.data
        } : null
      });
    }
  } catch (error: any) {
    console.error('[Diagnostics] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Register the diagnostics router in server/routes.ts
// End users will access it at /api/diagnostics/bnet-api