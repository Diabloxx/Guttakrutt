/**
 * Automated scheduled tasks for the guild website
 * 
 * This module defines cron jobs for:
 * - Daily guild member refresh at midnight
 * - Character score updates after member refresh
 * - Weekly raid boss progress refresh
 * - Logging all operations to database for admin panel viewing
 */

import cron from 'node-cron';
import axios from 'axios';
import { storage } from './storage';
import { WebLog, InsertWebLog } from '@shared/schema';
import { 
  refreshGuildMembers, 
  updateCharacterScores, 
  refreshRaidProgress, 
  refreshRaidBossData 
} from './services/refresh-service';
import { fetchGuildInfo } from './services/api-service';

// Create a utility to log operations to the database
export async function logOperation(
  operation: string, 
  status: 'success' | 'error' | 'warning' | 'info', 
  details: string,
  userId?: number | null,
  metadata?: Record<string, any>
): Promise<WebLog> {
  try {
    // If metadata is provided, stringify it to store in the database
    const metadataStr = metadata ? JSON.stringify(metadata) : undefined;
    
    const logEntry: InsertWebLog = {
      operation,
      status,
      details,
      timestamp: new Date(),
      userId: userId || undefined,
      metadata: metadataStr
    };
    
    return await storage.createWebLog(logEntry);
  } catch (error) {
    console.error('Failed to log operation:', error);
    throw error;
  }
}

// Initialize scheduled tasks
export function initScheduledTasks(serverUrl: string = 'http://localhost:5000') {
  console.log('Scheduling first automatic update...');
  
  // Trigger first update immediately after starting
  performDailyUpdate(serverUrl);
  
  // Daily update at midnight - refreshes members and scores
  cron.schedule('0 0 * * *', () => {
    console.log('Running scheduled task: Daily update at midnight');
    performDailyUpdate(serverUrl);
  });
  
  // Weekly raid data refresh on Sunday at 3:00 AM
  cron.schedule('0 3 * * 0', () => {
    console.log('Running scheduled task: Weekly raid data refresh');
    performWeeklyRaidDataRefresh(serverUrl);
  });
}

// Perform the daily update tasks (refresh members then update scores)
async function performDailyUpdate(serverUrl: string) {
  try {
    console.log('🔄 Starting scheduled daily update...');
    await logOperation('scheduled_daily_update', 'info', 'Starting daily automated refresh process');
    
    // Step 1: Update guild info
    console.log('📊 Updating guild information from Raider.IO API...');
    const guildInfo = await fetchGuildInfo('Guttakrutt', 'Tarren Mill', 'eu');
    
    if (!guildInfo) {
      throw new Error('Failed to fetch guild info from Raider.IO API');
    }
    
    console.log(`✅ Updated guild info: ${guildInfo.name} (${guildInfo.realm}), ${guildInfo.memberCount} members`);
    await logOperation('guild_info_update', 'success', 
      `Updated guild info: ${guildInfo.name} (${guildInfo.realm}), ${guildInfo.memberCount} members`);
    
    // Step 2: Refresh guild members
    console.log(`📊 Updating ${guildInfo.memberCount} guild members...`);
    const membersResult = await refreshGuildMembers('Guttakrutt', 'Tarren Mill', 'eu');
    
    console.log(`✅ Guild members updated: ${membersResult.added} added, ${membersResult.updated} updated, ${membersResult.removed} removed`);
    await logOperation('guild_members_refresh', 'success', 
      `Guild members updated: ${membersResult.added} added, ${membersResult.updated} updated, ${membersResult.removed} removed`);
    
    // Step 3: Update character scores
    console.log('📊 Updating character scores...');
    const scoreResult = await updateCharacterScores();
    
    console.log(`✅ Character scores updated: ${scoreResult.updated} updated, ${scoreResult.failed} failed, ${scoreResult.skipped} skipped`);
    await logOperation('character_scores_update', 'success', 
      `Character scores updated: ${scoreResult.updated} updated, ${scoreResult.failed} failed, ${scoreResult.skipped} skipped`);
    
    console.log('✅ Daily update completed successfully!');
    await logOperation('scheduled_daily_update', 'success', 'Daily automated refresh process completed successfully');
  } catch (error: any) {
    console.error('❌ Error during daily update:', error.message);
    await logOperation('scheduled_daily_update', 'error', `Daily update failed: ${error.message}`);
  }
}

// Perform the weekly raid data refresh tasks
async function performWeeklyRaidDataRefresh(serverUrl: string) {
  try {
    console.log('🔄 Starting weekly raid data refresh...');
    await logOperation('weekly_raid_refresh', 'info', 'Starting weekly raid data refresh process');
    
    // Update raid progress data directly
    console.log('📊 Updating raid progress for Liberation of Undermine (mythic)...');
    await refreshRaidProgress('Guttakrutt', 'Tarren Mill', 'eu', 'Liberation of Undermine', 'mythic');
    
    console.log('✅ Raid progress data updated!');
    await logOperation('raid_progress_refresh', 'success', 'Raid progress data updated successfully');
    
    // Update raid boss data for current tier directly
    console.log('📊 Updating raid boss data for Liberation of Undermine (mythic)...');
    await refreshRaidBossData('Guttakrutt', 'Tarren Mill', 'eu', 'Liberation of Undermine', 'mythic');
    
    console.log('✅ Raid boss data updated!');
    await logOperation('raid_bosses_refresh', 'success', 'Raid boss data updated successfully');
    
    // Update raid boss data for previous tier directly
    console.log('📊 Updating raid boss data for Nerub-ar Palace (mythic)...');
    await refreshRaidBossData('Guttakrutt', 'Tarren Mill', 'eu', 'Nerub-ar Palace', 'mythic');
    
    console.log('✅ Previous tier raid data updated!');
    await logOperation('previous_tier_refresh', 'success', 'Previous tier raid data updated successfully');
    
    console.log('✅ Weekly raid data refresh completed successfully!');
    await logOperation('weekly_raid_refresh', 'success', 'Weekly raid data refresh process completed successfully');
  } catch (error: any) {
    console.error('❌ Error during weekly raid data refresh:', error.message);
    await logOperation('weekly_raid_refresh', 'error', `Weekly raid data refresh failed: ${error.message || String(error)}`);
  }
}