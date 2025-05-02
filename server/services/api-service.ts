/**
 * API Service for fetching data from external APIs
 * Handles all communication with Raider.IO, WarcraftLogs, and Blizzard APIs
 */

import axios from 'axios';
import { storage } from '../storage';
import { logOperation } from '../cron-tasks';
import { Guild, InsertGuild } from '@shared/schema';

// Define consistent retry configuration
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

/**
 * Fetch guild information from Raider.IO API
 * 
 * @param guildName The guild name
 * @param realm The realm name
 * @param region The region (eu, us, etc.)
 * @returns The guild info or null if not found
 */
export async function fetchGuildInfo(
  guildName: string,
  realm: string,
  region: string
): Promise<any> {
  try {
    // Prepare realm name for API query (convert spaces to hyphens, remove apostrophes, and lowercase)
    const realmSlug = realm.replace(/\s+/g, '-').replace(/'/g, '').toLowerCase();
    
    const response = await axios.get(
      `https://raider.io/api/v1/guilds/profile`,
      {
        params: {
          region,
          realm: realmSlug,
          name: guildName,
          fields: 'raid_progression,raid_rankings,faction,members,mythic_plus_scores_by_season:current'
        }
      }
    );
    
    if (response.status === 200 && response.data) {
      // Transform the API response into our guild format
      const guildData = response.data;
      
      // Get the guild from database
      let guild = await storage.getGuildByName(guildName, realm);
      
      if (guild) {
        // Update existing guild
        guild = await storage.updateGuild(guild.id, {
          faction: guildData.faction || guild.faction,
          emblemUrl: guildData.profile_banner_url || guild.emblemUrl,
          memberCount: guildData.members?.length || guild.memberCount,
          lastUpdated: new Date()
        });
      } else {
        // Create new guild (this should rarely happen as guilds should be seeded)
        guild = await storage.createGuild({
          name: guildName,
          realm,
          region,
          faction: guildData.faction || 'Unknown',
          emblemUrl: guildData.profile_banner_url || '',
          memberCount: guildData.members?.length || 0,
          lastUpdated: new Date()
        });
      }
      
      return {
        ...guildData,
        id: guild.id,
        name: guildName,
        realm,
        region,
        memberCount: guildData.members?.length || 0
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching guild info:', error);
    await logOperation('api_fetch_guild', 'error', `Failed to fetch guild info for ${guildName} (${realm}): ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Fetch character profile from Raider.IO API with retries and exponential backoff
 * 
 * @param name Character name
 * @param realm Realm name
 * @param region Region (eu, us, etc.)
 * @returns Character profile or null if not found
 */
export async function fetchCharacterProfile(
  name: string,
  realm: string,
  region: string,
  retryCount: number = 0
): Promise<any> {
  try {
    // Prepare realm name for API query (convert spaces to hyphens, remove apostrophes, and lowercase)
    const realmSlug = realm.replace(/\s+/g, '-').replace(/'/g, '').toLowerCase();
    
    // Make the API request
    const response = await axios.get(
      `https://raider.io/api/v1/characters/profile`,
      {
        params: {
          region,
          realm: realmSlug,
          name,
          fields: 'gear,mythic_plus_scores_by_season:current'
        }
      }
    );
    
    if (response.status === 200 && response.data) {
      return response.data;
    }
    
    return null;
  } catch (error: any) {
    // If we get a rate limit error or server error, retry with exponential backoff
    if ((error.response?.status === 429 || error.response?.status >= 500) && retryCount < MAX_RETRIES) {
      // Calculate exponential backoff delay
      const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, retryCount);
      console.log(`API rate limit hit or server error. Retrying in ${backoffTime}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      
      // Wait for the backoff period
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      
      // Retry the request
      return fetchCharacterProfile(name, realm, region, retryCount + 1);
    }
    
    // For 404 errors, we just return null silently as the character might not exist
    if (error.response?.status === 404 || error.response?.status === 400) {
      return null;
    }
    
    // For other errors, log them
    console.error(`Error fetching character profile for ${name} (${realm}):`, error);
    await logOperation('api_fetch_character', 'error', `Failed to fetch character profile for ${name} (${realm}): ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Fetch raid progression data from WarcraftLogs API
 * 
 * @param guildName Guild name
 * @param realm Realm name
 * @param region Region (eu, us, etc.)
 * @param raid Raid name
 * @returns Raid progression data or null if not found
 */
export async function fetchRaidProgression(
  guildName: string,
  realm: string,
  region: string,
  raid: string
): Promise<any> {
  try {
    // Prepare realm name for API query (convert spaces to hyphens, remove apostrophes, and lowercase)
    const realmSlug = realm.replace(/\s+/g, '-').replace(/'/g, '').toLowerCase();
    
    // First ensure we have a valid access token
    const token = await getWarcraftLogsToken();
    
    if (!token) {
      throw new Error('Failed to get WarcraftLogs API token');
    }
    
    // TODO: Implement the actual WarcraftLogs API query for raid progression
    // This will require using the GraphQL API for WarcraftLogs which is beyond
    // the scope of this implementation
    
    // For now, return null and log that this is not implemented
    await logOperation('api_fetch_raid_progression', 'warning', 
      `WarcraftLogs API integration for raid progression is not fully implemented yet.`);
    
    return null;
  } catch (error) {
    console.error(`Error fetching raid progression for ${guildName} (${raid}):`, error);
    await logOperation('api_fetch_raid_progression', 'error', 
      `Failed to fetch raid progression for ${guildName} (${raid}): ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Get a valid access token for the WarcraftLogs API
 * 
 * @returns Access token or null if it can't be obtained
 */
async function getWarcraftLogsToken(): Promise<string | null> {
  try {
    // Check if we have client credentials
    const clientId = process.env.WARCRAFTLOGS_CLIENT_ID;
    const clientSecret = process.env.WARCRAFTLOGS_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('WarcraftLogs API credentials not configured');
    }
    
    // Make a token request
    const tokenResponse = await axios.post(
      'https://www.warcraftlogs.com/oauth/token',
      new URLSearchParams({
        grant_type: 'client_credentials'
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
    
    if (tokenResponse.status === 200 && tokenResponse.data.access_token) {
      return tokenResponse.data.access_token;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting WarcraftLogs token:', error);
    return null;
  }
}