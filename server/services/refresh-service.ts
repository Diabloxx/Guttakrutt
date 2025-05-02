/**
 * Guild data refresh service
 * Handles refreshing guild members, character scores, raid progress, and boss data
 */

import axios from 'axios';
import { storage } from '../storage';
import { logOperation } from '../cron-tasks';
import { fetchGuildInfo, fetchCharacterProfile } from './api-service';
import { Character, InsertCharacter, RaidProgress, InsertRaidProgress, RaidBoss } from '@shared/schema';

// Refresh guild members data
export async function refreshGuildMembers(
  guildName: string,
  realm: string,
  region: string
): Promise<{ added: number; updated: number; removed: number }> {
  try {
    // Get guild data from API
    const guildInfo = await fetchGuildInfo(guildName, realm, region);
    
    if (!guildInfo) {
      throw new Error('Failed to fetch guild info from Raider.IO API');
    }
    
    // Get the guild from database
    const guild = await storage.getGuildByName(guildName, realm);
    
    if (!guild) {
      throw new Error(`Guild not found in database: ${guildName} (${realm})`);
    }
    
    // Store current member IDs to detect removed members
    const existingCharacters = await storage.getCharactersByGuildId(guild.id);
    const existingIds = new Set(existingCharacters.map(c => c.id));
    const processedIds = new Set<number>();
    
    let added = 0;
    let updated = 0;
    
    // Process members from the API
    if (guildInfo.members && guildInfo.members.length > 0) {
      for (const member of guildInfo.members) {
        if (member && member.character) {
          const character = member.character;
          const rank = member.rank || 0;
          
          // Check if this character already exists
          const existingCharacter = await storage.getCharacterByNameAndGuild(character.name, guild.id);
          
          if (existingCharacter) {
            // Update existing character
            await storage.updateCharacter(existingCharacter.id, {
              className: character.class || existingCharacter.className,
              specName: character.active_spec_name || character.spec || existingCharacter.specName,
              role: character.active_spec_role || existingCharacter.role,
              rank,
              level: character.level || 80, // Updated to level 80 for The War Within
              avatarUrl: character.thumbnail_url || existingCharacter.avatarUrl,
              itemLevel: character.gear?.item_level_equipped || existingCharacter.itemLevel,
              realm: character.realm || realm,
              // Handle different data structures that might come from the API for Mythic+ scores
              raiderIoScore: (() => {
                if (character.mythic_plus_scores_by_season) {
                  // First check if it's an array (older API version)
                  if (Array.isArray(character.mythic_plus_scores_by_season) && character.mythic_plus_scores_by_season.length > 0) {
                    return character.mythic_plus_scores_by_season[0]?.scores?.all || existingCharacter.raiderIoScore;
                  } 
                  // Then check if it's an object with current season (newer API version)
                  else if (character.mythic_plus_scores_by_season.current) {
                    return character.mythic_plus_scores_by_season.current.scores?.all || existingCharacter.raiderIoScore;
                  }
                } else if (character.mythic_plus_score) {
                  // Direct score field from some API responses
                  return character.mythic_plus_score;
                }
                return existingCharacter.raiderIoScore || 0;
              })(),
              blizzardId: character.id ? character.id.toString() : existingCharacter.blizzardId,
              lastUpdated: new Date()
            });
            
            // Mark this character as processed
            processedIds.add(existingCharacter.id);
            updated++;
          } else {
            // Create a new character
            const newCharacter = await storage.createCharacter({
              name: character.name,
              className: character.class || "Unknown",
              specName: character.active_spec_name || character.spec || "",
              role: character.active_spec_role || null,
              rank,
              level: character.level || 80, // Updated to level 80 for The War Within
              avatarUrl: character.thumbnail_url || "",
              itemLevel: character.gear?.item_level_equipped || 0,
              realm: character.realm || realm,
              // Handle different data structures that might come from the API for Mythic+ scores
              raiderIoScore: (() => {
                if (character.mythic_plus_scores_by_season) {
                  // First check if it's an array (older API version)
                  if (Array.isArray(character.mythic_plus_scores_by_season) && character.mythic_plus_scores_by_season.length > 0) {
                    return character.mythic_plus_scores_by_season[0]?.scores?.all || 0;
                  } 
                  // Then check if it's an object with current season (newer API version)
                  else if (character.mythic_plus_scores_by_season.current) {
                    return character.mythic_plus_scores_by_season.current.scores?.all || 0;
                  }
                } else if (character.mythic_plus_score) {
                  // Direct score field from some API responses
                  return character.mythic_plus_score;
                }
                return 0;
              })(),
              guildId: guild.id,
              blizzardId: character.id ? character.id.toString() : ""
            });
            
            // Mark new character as processed
            if (newCharacter) {
              processedIds.add(newCharacter.id);
            }
            added++;
          }
        }
      }
    }
    
    // Find characters that are no longer in the guild
    const removedIds = Array.from(existingIds).filter(id => !processedIds.has(id));
    let removed = 0;
    
    // Handle removed members (optional, can be set to just mark them as inactive)
    for (const id of removedIds) {
      // Option 1: Delete the character
      // await storage.deleteCharacter(id);
      
      // Option 2: Mark as inactive or set guild ID to null to keep history
      await storage.updateCharacter(id, {
        lastUpdated: new Date(),
        // Set additional fields to indicate the character is no longer in the guild
        // guildId: null, // This would remove them from the guild
        // isActive: false, // If you have such a field
      });
      
      removed++;
    }
    
    // Update guild member count
    await storage.updateGuild(guild.id, {
      memberCount: guildInfo.members?.length || guild.memberCount,
      lastUpdated: new Date()
    });
    
    return { added, updated, removed };
  } catch (error) {
    console.error('Error refreshing guild members:', error);
    await logOperation('guild_members_refresh', 'error', `Failed to refresh guild members: ${error instanceof Error ? error.message : String(error)}`);
    return { added: 0, updated: 0, removed: 0 };
  }
}

/**
 * Refresh raid progress data for a specific raid and difficulty
 * 
 * @param guildName Guild name
 * @param realm Realm name
 * @param region Region code (eu, us, etc.)
 * @param raidName Raid name (e.g., "Liberation of Undermine")
 * @param difficulty Raid difficulty (mythic, heroic, etc.)
 * @returns Object containing success status and message
 */
export async function refreshRaidProgress(
  guildName: string,
  realm: string,
  region: string,
  raidName: string,
  difficulty: string
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`📊 Refreshing raid progress for ${raidName} (${difficulty})...`);
    
    // Get guild from database
    const guild = await storage.getGuildByName(guildName, realm);
    
    if (!guild) {
      throw new Error(`Guild not found: ${guildName} (${realm})`);
    }
    
    // Check if there's an existing progress entry
    const existingProgresses = await storage.getRaidProgressesByGuildId(guild.id);
    const existingProgress = existingProgresses.find(
      p => p.name === raidName && p.difficulty === difficulty
    );
    
    // Default values
    const progress: Partial<InsertRaidProgress> = {
      name: raidName,
      difficulty,
      bossesDefeated: 0,
      bosses: 0,
      guildId: guild.id,
      lastUpdated: new Date()
    };
    
    // 1. Raid-specific data
    // The War Within: Liberation of Undermine progress
    if (raidName === 'Liberation of Undermine') {
      // Get boss data to count defeated bosses
      const raidBosses = await storage.getRaidBossesByGuildId(guild.id, raidName, difficulty);
      const defeatedBosses = raidBosses.filter(boss => boss.defeated).length;
      
      progress.bosses = 8; // Liberation of Undermine has 8 bosses
      progress.bossesDefeated = defeatedBosses;
      progress.worldRank = existingProgress?.worldRank || 0;
      progress.regionRank = existingProgress?.regionRank || 0;
      progress.realmRank = existingProgress?.realmRank || 0;
    } 
    // The War Within: Nerub-ar Palace progress
    else if (raidName === 'Nerub-ar Palace') {
      // Get boss data to count defeated bosses
      const raidBosses = await storage.getRaidBossesByGuildId(guild.id, raidName, difficulty);
      const defeatedBosses = raidBosses.filter(boss => boss.defeated).length;
      
      progress.bosses = 8; // Nerub-ar Palace has 8 bosses
      progress.bossesDefeated = defeatedBosses;
      progress.worldRank = existingProgress?.worldRank || 0;
      progress.regionRank = existingProgress?.regionRank || 0;
      progress.realmRank = existingProgress?.realmRank || 0;
    } else {
      // For other raids, keep existing values if available
      if (existingProgress) {
        progress.bosses = existingProgress.bosses;
        progress.bossesDefeated = existingProgress.bossesDefeated;
        progress.worldRank = existingProgress.worldRank;
        progress.regionRank = existingProgress.regionRank;
        progress.realmRank = existingProgress.realmRank;
      }
    }
    
    // Update or create raid progress
    if (existingProgress) {
      await storage.updateRaidProgress(existingProgress.id, progress);
      console.log(`✅ Updated raid progress for ${raidName} (${difficulty}): ${progress.bossesDefeated}/${progress.bosses}`);
      return { 
        success: true, 
        message: `Updated raid progress for ${raidName} (${difficulty}): ${progress.bossesDefeated}/${progress.bosses}` 
      };
    } else {
      await storage.createRaidProgress(progress as InsertRaidProgress);
      console.log(`✅ Created new raid progress for ${raidName} (${difficulty}): ${progress.bossesDefeated}/${progress.bosses}`);
      return { 
        success: true, 
        message: `Created new raid progress for ${raidName} (${difficulty}): ${progress.bossesDefeated}/${progress.bosses}` 
      };
    }
  } catch (error) {
    console.error(`Error refreshing raid progress for ${raidName} (${difficulty}):`, error);
    await logOperation(
      'raid_progress_refresh', 
      'error', 
      `Failed to refresh raid progress for ${raidName} (${difficulty}): ${error instanceof Error ? error.message : String(error)}`
    );
    return { 
      success: false, 
      message: `Failed to refresh raid progress: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Refresh raid boss data for a specific raid and difficulty
 * 
 * @param guildName Guild name
 * @param realm Realm name
 * @param region Region code (eu, us, etc.)
 * @param raidName Raid name (e.g., "Liberation of Undermine")
 * @param difficulty Raid difficulty (mythic, heroic, etc.)
 * @returns Object containing success status, updated bosses, and message
 */
export async function refreshRaidBossData(
  guildName: string,
  realm: string,
  region: string,
  raidName: string,
  difficulty: string
): Promise<{ success: boolean; bosses: RaidBoss[]; message: string }> {
  try {
    console.log(`📊 Refreshing raid boss data for ${raidName} (${difficulty})...`);
    
    // Get guild from database
    const guild = await storage.getGuildByName(guildName, realm);
    
    if (!guild) {
      throw new Error(`Guild not found: ${guildName} (${realm})`);
    }
    
    // Get existing raid bosses
    const existingBosses = await storage.getRaidBossesByGuildId(guild.id, raidName, difficulty);
    
    // If we have bosses, update their lastUpdated timestamp
    if (existingBosses.length > 0) {
      for (const boss of existingBosses) {
        await storage.updateRaidBoss(boss.id, {
          lastUpdated: new Date()
        });
      }
      
      // Fetch the updated bosses
      const updatedBosses = await storage.getRaidBossesByGuildId(guild.id, raidName, difficulty);
      
      // Also update the raid progress
      await refreshRaidProgress(guildName, realm, region, raidName, difficulty);
      
      console.log(`✅ Updated ${updatedBosses.length} bosses for ${raidName} (${difficulty})`);
      return {
        success: true,
        bosses: updatedBosses,
        message: `Successfully refreshed data for ${updatedBosses.length} bosses`
      };
    } else {
      // No bosses found - this is expected if it's the first time running
      console.log(`ℹ️ No bosses found for ${raidName} (${difficulty})`);
      return {
        success: true,
        bosses: [],
        message: `No bosses found for ${raidName} (${difficulty})`
      };
    }
  } catch (error) {
    console.error(`Error refreshing raid boss data for ${raidName} (${difficulty}):`, error);
    await logOperation(
      'raid_bosses_refresh', 
      'error', 
      `Failed to refresh raid boss data for ${raidName} (${difficulty}): ${error instanceof Error ? error.message : String(error)}`
    );
    return { 
      success: false, 
      bosses: [],
      message: `Failed to refresh raid boss data: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

// Update character scores
export async function updateCharacterScores(): Promise<{ updated: number; failed: number; skipped: number }> {
  try {
    // Get all guilds (typically just one for a guild website)
    const guild = await storage.getGuildByName('Guttakrutt', 'Tarren Mill');
    
    if (!guild) {
      throw new Error('Guild not found');
    }
    
    // Get all characters for the guild
    const characters = await storage.getCharactersByGuildId(guild.id);
    
    let updated = 0;
    let failed = 0;
    let skipped = 0;
    let batchSize = 0;
    
    // Process characters in small batches with pauses to avoid rate limiting
    for (let i = 0; i < characters.length; i++) {
      const character = characters[i];
      
      try {
        // Skip characters with recent updates (within the last 24 hours)
        const lastUpdated = character.lastUpdated ? new Date(character.lastUpdated) : new Date(0);
        const now = new Date();
        const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
        
        // Skip if updated less than 24 hours ago
        if (hoursSinceUpdate < 24) {
          skipped++;
          continue;
        }
        
        // Fetch character profile from Raider.IO API
        const profile = await fetchCharacterProfile(character.name, character.realm || 'Tarren Mill', 'eu');
        
        if (profile) {
          // Extract Mythic+ score from the profile
          let score = 0;
          
          // Handle different data structures that might come from the API
          if (profile.mythic_plus_scores_by_season) {
            // First check if it's an array (older API version)
            if (Array.isArray(profile.mythic_plus_scores_by_season) && profile.mythic_plus_scores_by_season.length > 0) {
              score = profile.mythic_plus_scores_by_season[0]?.scores?.all || 0;
            } 
            // Then check if it's an object with current season (newer API version)
            else if (profile.mythic_plus_scores_by_season.current) {
              score = profile.mythic_plus_scores_by_season.current.scores?.all || 0;
            }
          } else if (profile.mythic_plus_score) {
            // Direct score field from some API responses
            score = profile.mythic_plus_score;
          }
          
          // Convert to integer (database requires integers, API returns decimals)
          const intScore = Math.round(score);
          
          // Update the character in the database
          await storage.updateCharacter(character.id, {
            raiderIoScore: intScore,
            itemLevel: profile.gear?.item_level_equipped || character.itemLevel,
            avatarUrl: profile.thumbnail_url || character.avatarUrl,
            lastUpdated: new Date()
          });
          
          updated++;
        } else {
          // Character not found in Raider.IO API
          failed++;
        }
      } catch (error) {
        console.error(`Error updating character ${character.name}:`, error);
        failed++;
      }
      
      // Increment batch counter
      batchSize++;
      
      // If we've processed a batch of characters or reached the end, pause to avoid rate limiting
      if (batchSize >= 5 || i === characters.length - 1) {
        console.log(`Processed ${batchSize} characters. Waiting 5 seconds before processing next batch...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        batchSize = 0;
      }
    }
    
    return { updated, failed, skipped };
  } catch (error) {
    console.error('Error updating character scores:', error);
    await logOperation('character_scores_update', 'error', `Failed to update character scores: ${error instanceof Error ? error.message : String(error)}`);
    return { updated: 0, failed: 0, skipped: 0 };
  }
}