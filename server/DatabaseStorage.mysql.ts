/**
 * MySQL-specific implementation of DatabaseStorage
 * This addresses schema differences between PostgreSQL and MySQL
 */

import { DatabaseStorage } from './DatabaseStorage';
import * as schema from '@shared/schema';
import { eq, asc, desc, sql, and } from 'drizzle-orm';
import { getDb, pool } from './db';

/**
 * MySQL-compatible version of DatabaseStorage that handles schema differences
 */
export class MySqlDatabaseStorage extends DatabaseStorage {
  
  /**
   * Override createUser to handle the lack of returning() in MySQL
   * Also ensures that necessary field names are present in the correct format
   */
  async createUser(userData: schema.InsertUser): Promise<schema.User> {
    try {
      // Clone user data to avoid modifying the original object
      const userDataForMySQL: any = { ...userData };
      
      // Ensure MySQL field name compatibility
      // Handle snake_case to camelCase field mapping explicitly
      if (userData.battleTag && !userDataForMySQL.battle_tag) {
        userDataForMySQL.battle_tag = userData.battleTag;
      }
      
      if (userData.battleNetId && !userDataForMySQL.battle_net_id) {
        userDataForMySQL.battle_net_id = userData.battleNetId;
      }
      
      if (userData.accessToken && !userDataForMySQL.access_token) {
        userDataForMySQL.access_token = userData.accessToken;
      }
      
      if (userData.refreshToken && !userDataForMySQL.refresh_token) {
        userDataForMySQL.refresh_token = userData.refreshToken;
      }
      
      if (userData.tokenExpiry && !userDataForMySQL.token_expiry) {
        userDataForMySQL.token_expiry = userData.tokenExpiry;
      }
      
      if (userData.lastLogin && !userDataForMySQL.last_login) {
        userDataForMySQL.last_login = userData.lastLogin;
      }
      
      if (userData.createdAt && !userDataForMySQL.created_at) {
        userDataForMySQL.created_at = userData.createdAt;
      }
      
      if (userData.isGuildMember !== undefined && userDataForMySQL.is_guild_member === undefined) {
        userDataForMySQL.is_guild_member = userData.isGuildMember;
      }
      
      if (userData.isOfficer !== undefined && userDataForMySQL.is_officer === undefined) {
        userDataForMySQL.is_officer = userData.isOfficer;
      }
      
      if (userData.avatarUrl && !userDataForMySQL.avatar_url) {
        userDataForMySQL.avatar_url = userData.avatarUrl;
      }
      
      // For MySQL, we need to ensure default values for NOT NULL fields
      // These are the fields that can't be null according to the schema
      if (!userDataForMySQL.battle_tag) {
        userDataForMySQL.battle_tag = userData.battleTag || 'Unknown#0000';
      }
      
      if (!userDataForMySQL.email && !userData.email) {
        userDataForMySQL.email = '';  // Empty string instead of null
      }
      
      if (!userDataForMySQL.refresh_token && !userData.refreshToken) {
        userDataForMySQL.refresh_token = '';  // Empty string instead of null
      }
      
      // Ensure region and locale have values if not specified
      if (!userDataForMySQL.region && !userData.region) {
        userDataForMySQL.region = 'eu';
      }
      
      if (!userDataForMySQL.locale && !userData.locale) {
        userDataForMySQL.locale = 'en_GB';
      }
      
      // Force default values for boolean fields if they're undefined
      if (userDataForMySQL.is_guild_member === undefined && userData.isGuildMember === undefined) {
        userDataForMySQL.is_guild_member = false;
      }
      
      if (userDataForMySQL.is_officer === undefined && userData.isOfficer === undefined) {
        userDataForMySQL.is_officer = false;
      }
      
      // If avatar URL is undefined, use empty string
      if (!userDataForMySQL.avatar_url && !userData.avatarUrl) {
        userDataForMySQL.avatar_url = '';
      }
      
      console.log('MySQL createUser: Prepared user data with field mappings', {
        originalFields: Object.keys(userData),
        mappedFields: Object.keys(userDataForMySQL),
        battle_tag_value: userDataForMySQL.battle_tag,
        battle_net_id_value: userDataForMySQL.battle_net_id
      });
      
      // Insert with prepared data
      const db = await getDb();
      
      // Use raw SQL for flexibility with SQL dialect differences
      try {
        // Log the exact data we're about to insert
        console.log('MySQL createUser: About to insert user with data:', JSON.stringify(userDataForMySQL, null, 2));
        
        // Convert dates to proper ISO string format for MySQL
        if (userDataForMySQL.token_expiry instanceof Date) {
          userDataForMySQL.token_expiry = userDataForMySQL.token_expiry.toISOString().slice(0, 19).replace('T', ' ');
        }
        
        if (userDataForMySQL.last_login instanceof Date) {
          userDataForMySQL.last_login = userDataForMySQL.last_login.toISOString().slice(0, 19).replace('T', ' ');
        }
        
        if (userDataForMySQL.created_at instanceof Date) {
          userDataForMySQL.created_at = userDataForMySQL.created_at.toISOString().slice(0, 19).replace('T', ' ');
        }
        
        // Use direct SQL to handle MySQL-specific insert
        const result = await pool.query(`
          INSERT INTO users (
            battle_net_id, battle_tag, email, access_token, refresh_token, 
            token_expiry, last_login, created_at, is_guild_member, is_officer, 
            region, locale, avatar_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userDataForMySQL.battle_net_id,
          userDataForMySQL.battle_tag,
          userDataForMySQL.email || '',
          userDataForMySQL.access_token || '',
          userDataForMySQL.refresh_token || '',
          userDataForMySQL.token_expiry || new Date().toISOString().slice(0, 19).replace('T', ' '),
          userDataForMySQL.last_login || new Date().toISOString().slice(0, 19).replace('T', ' '),
          userDataForMySQL.created_at || new Date().toISOString().slice(0, 19).replace('T', ' '),
          userDataForMySQL.is_guild_member ? 1 : 0,
          userDataForMySQL.is_officer ? 1 : 0,
          userDataForMySQL.region || 'eu',
          userDataForMySQL.locale || 'en_GB',
          userDataForMySQL.avatar_url || ''
        ]);
        
        try {
          // Get the inserted ID from the result
          const insertId = result[0]?.insertId || result.insertId;
          console.log(`MySQL createUser: Insert successful, got ID: ${insertId}`);
          
          // If we got an ID back, fetch the complete user
          if (insertId) {
            const selectResult = await pool.query('SELECT * FROM users WHERE id = ?', [insertId]);
            const userResult = selectResult[0] || selectResult;
            
            if (userResult && (Array.isArray(userResult) ? userResult.length > 0 : userResult)) {
              // Handle different MySQL driver result formats
              const user = Array.isArray(userResult) ? userResult[0] : userResult;
              console.log(`MySQL createUser: Successfully retrieved created user with ID ${insertId}`);
              
              // Map MySQL snake_case fields to camelCase for consistency
              return {
                ...user,
                id: user.id,
                battleNetId: user.battle_net_id || user.battleNetId,
                battleTag: user.battle_tag || user.battleTag,
                accessToken: user.access_token || user.accessToken,
                refreshToken: user.refresh_token || user.refreshToken,
                tokenExpiry: user.token_expiry || user.tokenExpiry,
                lastLogin: user.last_login || user.lastLogin,
                createdAt: user.created_at || user.createdAt,
                isGuildMember: user.is_guild_member !== undefined ? !!user.is_guild_member : !!user.isGuildMember,
                isOfficer: user.is_officer !== undefined ? !!user.is_officer : !!user.isOfficer,
                avatarUrl: user.avatar_url || user.avatarUrl || ''
              };
            } else {
              console.error(`MySQL createUser: Could not retrieve created user with ID ${insertId}`);
              console.error('Select result:', selectResult);
            }
          }
        } catch (selectError) {
          console.error('MySQL createUser: Error retrieving created user:', selectError);
          // Create a synthetic user object from the data we have since the insert succeeded
          return {
            id: result[0]?.insertId || result.insertId,
            battleNetId: userDataForMySQL.battle_net_id,
            battleTag: userDataForMySQL.battle_tag,
            email: userDataForMySQL.email || '',
            accessToken: userDataForMySQL.access_token || '',
            refreshToken: userDataForMySQL.refresh_token || '',
            tokenExpiry: new Date(userDataForMySQL.token_expiry) || new Date(),
            lastLogin: new Date(userDataForMySQL.last_login) || new Date(),
            createdAt: new Date(userDataForMySQL.created_at) || new Date(),
            isGuildMember: !!userDataForMySQL.is_guild_member,
            isOfficer: !!userDataForMySQL.is_officer,
            region: userDataForMySQL.region || 'eu',
            locale: userDataForMySQL.locale || 'en_GB',
            avatarUrl: userDataForMySQL.avatar_url || ''
          };
        }
      } catch (insertError) {
        console.error('MySQL createUser: Error during insert operation:', insertError);
        throw new Error(`Failed to insert user data: ${insertError instanceof Error ? insertError.message : String(insertError)}`);
      }
      
      throw new Error('Failed to create user');
    } catch (error) {
      console.error('MySQL Error creating user:', error);
      throw error;
    }
  }
  
  /**
   * Override updateUser to handle the lack of returning() in MySQL
   * Also maps camelCase fields to snake_case for MySQL compatibility
   */
  async updateUser(id: number, userData: Partial<schema.InsertUser>): Promise<schema.User | undefined> {
    try {
      // Clone user data to avoid modifying the original object
      const userDataForMySQL: any = { ...userData };
      
      // Ensure MySQL field name compatibility
      // Handle camelCase to snake_case field mapping explicitly
      if (userData.battleTag && !userDataForMySQL.battle_tag) {
        userDataForMySQL.battle_tag = userData.battleTag;
      }
      
      if (userData.battleNetId && !userDataForMySQL.battle_net_id) {
        userDataForMySQL.battle_net_id = userData.battleNetId;
      }
      
      if (userData.accessToken && !userDataForMySQL.access_token) {
        userDataForMySQL.access_token = userData.accessToken;
      }
      
      if (userData.refreshToken && !userDataForMySQL.refresh_token) {
        userDataForMySQL.refresh_token = userData.refreshToken;
      }
      
      if (userData.tokenExpiry && !userDataForMySQL.token_expiry) {
        userDataForMySQL.token_expiry = userData.tokenExpiry;
      }
      
      if (userData.lastLogin && !userDataForMySQL.last_login) {
        userDataForMySQL.last_login = userData.lastLogin;
      } else if (!userDataForMySQL.last_login) {
        // Always update last_login
        userDataForMySQL.last_login = new Date();
      }
      
      if (userData.createdAt && !userDataForMySQL.created_at) {
        userDataForMySQL.created_at = userData.createdAt;
      }
      
      if (userData.isGuildMember !== undefined && userDataForMySQL.is_guild_member === undefined) {
        userDataForMySQL.is_guild_member = userData.isGuildMember;
      }
      
      if (userData.isOfficer !== undefined && userDataForMySQL.is_officer === undefined) {
        userDataForMySQL.is_officer = userData.isOfficer;
      }
      
      if (userData.avatarUrl && !userDataForMySQL.avatar_url) {
        userDataForMySQL.avatar_url = userData.avatarUrl;
      }
      
      console.log('MySQL updateUser: Prepared user data with field mappings', {
        id,
        originalFields: Object.keys(userData),
        mappedFields: Object.keys(userDataForMySQL)
      });
      
      const db = await getDb();
      await db
        .update(schema.users)
        .set(userDataForMySQL)
        .where(eq(schema.users.id, id));
      
      // Fetch the updated user
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, id));
      return user;
    } catch (error) {
      console.error('MySQL Error updating user:', error);
      return undefined;
    }
  }
  
  /**
   * Override getUserByUsername for MySQL
   */
  async getUserByUsername(username: string): Promise<schema.User | undefined> {
    try {
      console.log(`MySQL getUserByUsername: Looking for user with username=${username}`);
      const db = await getDb();
      
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.username, username));
      
      return user;
    } catch (error) {
      console.error('MySQL Error getting user by username:', error);
      return undefined;
    }
  }
  
  /**
   * Override getUserByEmail for MySQL
   */
  async getUserByEmail(email: string): Promise<schema.User | undefined> {
    try {
      console.log(`MySQL getUserByEmail: Looking for user with email=${email}`);
      const db = await getDb();
      
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email));
      
      return user;
    } catch (error) {
      console.error('MySQL Error getting user by email:', error);
      return undefined;
    }
  }
  
  /**
   * Override getUserByBattleNetId for MySQL
   */
  async getUserByBattleNetId(battleNetId: string): Promise<schema.User | undefined> {
    try {
      console.log(`MySQL getUserByBattleNetId: Looking for user with battleNetId=${battleNetId}`);
      const db = await getDb();
      
      // First try with camelCase field name
      let [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.battleNetId, battleNetId));
      
      if (!user) {
        // If not found, try with snake_case field name
        console.log(`MySQL getUserByBattleNetId: Not found with camelCase, trying snake_case`);
        // Using SQL directly for more flexibility with field names
        const result = await db.execute(
          sql`SELECT * FROM users WHERE battle_net_id = ${battleNetId}`
        );
        
        if (result && result.rows && result.rows.length > 0) {
          user = result.rows[0] as schema.User;
          console.log(`MySQL getUserByBattleNetId: Found user with snake_case query`);
        } else {
          console.log(`MySQL getUserByBattleNetId: User not found with either field name`);
        }
      } else {
        console.log(`MySQL getUserByBattleNetId: Found user with camelCase query`);
      }
      
      return user;
    } catch (error) {
      console.error('MySQL Error getting user by Battle.net ID:', error);
      return undefined;
    }
  }
  
  /**
   * Add method to get user by battle tag
   */
  async getUserByBattleTag(battleTag: string): Promise<schema.User | undefined> {
    try {
      console.log(`MySQL getUserByBattleTag: Looking for user with battleTag=${battleTag}`);
      const db = await getDb();
      
      // First try with exact match using camelCase field name
      let [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.battleTag, battleTag));
      
      if (user) {
        console.log(`MySQL getUserByBattleTag: Found user with exact camelCase match: ${user.id}`);
        return user;
      }
      
      // If not found, try with snake_case field name
      console.log(`MySQL getUserByBattleTag: Not found with camelCase, trying snake_case`);
      
      // First try exact match with snake_case
      const exactResult = await db.execute(
        sql`SELECT * FROM users WHERE battle_tag = ${battleTag}`
      );
      
      if (exactResult && exactResult.rows && exactResult.rows.length > 0) {
        user = exactResult.rows[0] as schema.User;
        console.log(`MySQL getUserByBattleTag: Found user with exact snake_case match: ${user.id}`);
        return user;
      }
      
      // As a last resort, try case-insensitive match
      console.log(`MySQL getUserByBattleTag: Not found with exact match, trying case-insensitive match`);
      const caseInsensitiveResult = await db.execute(
        sql`SELECT * FROM users WHERE LOWER(battle_tag) = LOWER(${battleTag})`
      );
      
      if (caseInsensitiveResult && caseInsensitiveResult.rows && caseInsensitiveResult.rows.length > 0) {
        user = caseInsensitiveResult.rows[0] as schema.User;
        console.log(`MySQL getUserByBattleTag: Found user with case-insensitive match: ${user.id}`);
        return user;
      }
      
      console.log(`MySQL getUserByBattleTag: User not found with any field name variation`);
      return undefined;
    } catch (error) {
      console.error('MySQL Error getting user by Battle Tag:', error);
      return undefined;
    }
  }

  /**
   * Override updateUserTokens for MySQL
   */
  async updateUserTokens(id: number, accessToken: string, refreshToken: string, tokenExpiry: Date): Promise<schema.User | undefined> {
    return this.updateUser(id, {
      accessToken,
      refreshToken,
      tokenExpiry,
      lastLogin: new Date()
    });
  }
  
  /**
   * Override updateUserLastLogin for MySQL
   */
  async updateUserLastLogin(id: number): Promise<schema.User | undefined> {
    try {
      console.log(`MySQL updateUserLastLogin: Updating last login for user ID=${id}`);
      const db = await getDb();
      
      // Update the user's last login time
      await db
        .update(schema.users)
        .set({
          lastLogin: new Date()
        })
        .where(eq(schema.users.id, id));
      
      // Fetch the updated user
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, id));
      
      return user;
    } catch (error) {
      console.error('MySQL Error updating user last login:', error);
      return undefined;
    }
  }
  
  /**
   * Override connectBattleNetAccount for MySQL
   */
  async connectBattleNetAccount(userId: number, battleNetId: string, battleTag: string, accessToken: string, refreshToken: string, tokenExpiry: Date): Promise<schema.User | undefined> {
    try {
      console.log(`MySQL connectBattleNetAccount: Connecting Battle.net account (${battleNetId}, ${battleTag}) to user ID ${userId}`);
      
      // First, check if the Battle.net ID is already connected to another account
      const existingUser = await this.getUserByBattleNetId(battleNetId);
      if (existingUser && existingUser.id !== userId) {
        console.warn(`MySQL connectBattleNetAccount: Battle.net ID ${battleNetId} is already connected to user ID ${existingUser.id}`);
        throw new Error('This Battle.net account is already connected to another user account');
      }
      
      // Update the user with the Battle.net info
      const db = await getDb();
      
      // Important: Include both camelCase and snake_case field names for MySQL compatibility
      console.log(`MySQL connectBattleNetAccount: Updating user with Battle Tag: ${battleTag}`);
      
      // Update the user record with both formats of field names for compatibility
      await db
        .update(schema.users)
        .set({
          // CamelCase fields for standard usage
          battleNetId,
          battleTag,
          accessToken,
          refreshToken,
          tokenExpiry,
          lastLogin: new Date(),
          
          // Snake_case fields for MySQL compatibility
          battle_net_id: battleNetId,
          battle_tag: battleTag,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expiry: tokenExpiry,
          last_login: new Date()
        })
        .where(eq(schema.users.id, userId));
      
      // Then retrieve the updated user
      const [updatedUser] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId));
      
      if (!updatedUser) {
        console.error(`MySQL connectBattleNetAccount: Failed to retrieve updated user after update`);
        return undefined;
      }
      
      console.log(`MySQL connectBattleNetAccount: Successfully connected Battle.net account. User now has Battle Tag: ${updatedUser.battleTag || updatedUser.battle_tag}`);
      return updatedUser;
    } catch (error) {
      console.error('MySQL Error connecting Battle.net account:', error);
      throw error;
    }
  }
  
  /**
   * Override updateUserBattleNetData for MySQL
   * Used to automatically update BattleTag when user logs in
   */
  async updateUserBattleNetData(
    userId: number,
    data: {
      battleTag?: string;
      [key: string]: any;
    }
  ): Promise<schema.User | undefined> {
    console.log(`MySQL updateUserBattleNetData: Updating Battle.net data for user ID ${userId}`);
    
    try {
      const db = await getDb();
      
      // Create update data objects with both camelCase and snake_case fields for compatibility
      const updateData: any = {};
      
      // Handle each field in the data object, setting both camelCase and snake_case versions
      if (data.battleTag) {
        updateData.battleTag = data.battleTag;
        updateData.battle_tag = data.battleTag;
        console.log(`MySQL updateUserBattleNetData: Updating Battle Tag to ${data.battleTag}`);
      }
      
      // Add other fields from data object
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'battleTag') {
          // Add camelCase version
          updateData[key] = value;
          
          // Convert to snake_case and add that version too
          const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          if (snakeKey !== key) {
            updateData[snakeKey] = value;
          }
        }
      });
      
      // Perform the update
      await db
        .update(schema.users)
        .set(updateData)
        .where(eq(schema.users.id, userId));
      
      // Then retrieve the updated user
      const [updatedUser] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId));
      
      // Log success with the battle tag for debugging
      if (updatedUser) {
        console.log(`MySQL updateUserBattleNetData: Successfully updated Battle.net data for user ID ${userId}`);
        if (data.battleTag) {
          console.log(`MySQL updateUserBattleNetData: Updated Battle Tag: ${updatedUser.battleTag || updatedUser.battle_tag}`);
        }
      } else {
        console.error(`MySQL updateUserBattleNetData: Failed to update Battle.net data for user ID ${userId}. Could not retrieve user after update.`);
      }
      
      return updatedUser;
    } catch (error) {
      console.error('MySQL Error updating Battle.net data:', error);
      throw error;
    }
  }
  
  /**
   * Override verifyCharacterOwnership for MySQL
   */
  async verifyCharacterOwnership(userId: number, characterId: number): Promise<boolean> {
    try {
      const db = await getDb();
      await db
        .update(schema.userCharacters)
        .set({ 
          verified: true,
          verifiedAt: new Date()
        })
        .where(
          sql`${schema.userCharacters.userId} = ${userId} AND ${schema.userCharacters.characterId} = ${characterId}`
        );
      
      return true;
    } catch (error) {
      console.error('MySQL Error verifying character ownership:', error);
      return false;
    }
  }
  
  /**
   * Override setMainCharacter for MySQL
   */
  async setMainCharacter(userId: number, characterId: number): Promise<boolean> {
    try {
      const db = await getDb();
      
      // First, set all characters to isMain = false
      await db
        .update(schema.userCharacters)
        .set({ isMain: false })
        .where(eq(schema.userCharacters.userId, userId));
      
      // Then set the selected character as main
      await db
        .update(schema.userCharacters)
        .set({ isMain: true })
        .where(
          sql`${schema.userCharacters.userId} = ${userId} AND ${schema.userCharacters.characterId} = ${characterId}`
        );
      
      return true;
    } catch (error) {
      console.error('MySQL Error setting main character:', error);
      return false;
    }
  }
  
  /**
   * Override userOwnsCharacter for MySQL
   */
  async userOwnsCharacter(userId: number, characterId: number): Promise<boolean> {
    try {
      const db = await getDb();
      const [link] = await db
        .select()
        .from(schema.userCharacters)
        .where(
          sql`${schema.userCharacters.userId} = ${userId} AND ${schema.userCharacters.characterId} = ${characterId}`
        );
      return !!link;
    } catch (error) {
      console.error('MySQL Error checking character ownership:', error);
      return false;
    }
  }
  
  /**
   * Override getUserCharacters for MySQL to handle potential errors
   */
  async getUserCharacters(userId: number): Promise<(schema.Character & { isMain: boolean, verified: boolean })[]> {
    try {
      const db = await getDb();
      
      // Use a more robust query for MySQL that avoids joins if needed
      // First try to get all user characters
      try {
        const userChars = await db
          .select({
            ...schema.characters,
            isMain: schema.userCharacters.isMain,
            verified: schema.userCharacters.verified
          })
          .from(schema.userCharacters)
          .innerJoin(schema.characters, eq(schema.userCharacters.characterId, schema.characters.id))
          .where(eq(schema.userCharacters.userId, userId));
        
        return userChars;
      } catch (joinError) {
        console.error('Error in MySQL getUserCharacters with join:', joinError);
        // Fallback to at least return empty array instead of failing
        return [];
      }
    } catch (error) {
      console.error('Error in MySQL getUserCharacters:', error);
      // Return empty array instead of failing
      return [];
    }
  }
  
  /**
   * Override getUserMainCharacter for MySQL
   */
  async getUserMainCharacter(userId: number): Promise<(schema.Character & { isMain: boolean, verified: boolean }) | undefined> {
    try {
      const db = await getDb();
      const results = await db
        .select({
          ...schema.characters,
          isMain: schema.userCharacters.isMain,
          verified: schema.userCharacters.verified
        })
        .from(schema.userCharacters)
        .innerJoin(
          schema.characters, 
          sql`${schema.userCharacters.characterId} = ${schema.characters.id}`
        )
        .where(
          sql`${schema.userCharacters.userId} = ${userId} AND ${schema.userCharacters.isMain} = TRUE`
        );
      
      return results[0];
    } catch (error) {
      console.error('MySQL Error getting user main character:', error);
      return undefined;
    }
  }
  
  /**
   * Override linkCharacterToUser to handle the lack of returning() in MySQL
   */
  async linkCharacterToUser(linkData: schema.InsertUserCharacter): Promise<schema.UserCharacter> {
    try {
      const db = await getDb();
      const result = await db
        .insert(schema.userCharacters)
        .values(linkData);
      
      // Get the inserted ID and fetch the complete link
      const insertId = 'insertId' in result ? result.insertId : 0;
      if (insertId) {
        const [link] = await db
          .select()
          .from(schema.userCharacters)
          .where(eq(schema.userCharacters.id, insertId));
        return link;
      }
      throw new Error('Failed to link character to user');
    } catch (error) {
      console.error('MySQL Error linking character to user:', error);
      throw error;
    }
  }
  /**
   * Override createCharacter to handle the lack of returning() in MySQL
   */
  async createCharacter(character: schema.InsertCharacter): Promise<schema.Character> {
    try {
      console.log('MySQL createCharacter - Creating character:', character);
      const db = await getDb();
      
      // Insert first
      const result = await db
        .insert(schema.characters)
        .values(character);
      
      // Get the ID of the inserted record
      const insertId = result[0].insertId;
      
      // Then retrieve the inserted character by its ID
      const [createdCharacter] = await db
        .select()
        .from(schema.characters)
        .where(eq(schema.characters.id, insertId));
      
      return createdCharacter;
    } catch (error) {
      console.error("Error creating character:", error);
      throw new Error(`Failed to create character: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Override updateCharacter to handle the lack of returning() in MySQL
   * Also handles proper conversion of decimal scores to integers
   */
  async updateCharacter(id: number, characterData: Partial<schema.InsertCharacter>): Promise<schema.Character | undefined> {
    try {
      console.log('MySQL updateCharacter - Updating character ID:', id, 'with data:', characterData);
      
      // Ensure raiderIoScore is an integer if present
      if (characterData.raiderIoScore !== undefined) {
        const score = characterData.raiderIoScore;
        
        // Convert any decimal scores to integers using Math.round()
        if (typeof score === 'string') {
          try {
            // Handle string scores with proper parsing and rounding
            const floatValue = parseFloat(score);
            characterData.raiderIoScore = Math.round(floatValue);
          } catch (e) {
            console.warn(`Failed to parse score string: ${score}`, e);
            characterData.raiderIoScore = 0;
          }
        } else if (typeof score === 'number') {
          // If it's already a number, round it and ensure it's an integer
          characterData.raiderIoScore = Math.round(score);
        }
        
        // Additional safeguard to ensure it's always an integer
        if (isNaN(characterData.raiderIoScore)) {
          characterData.raiderIoScore = 0;
        }
        
        // Force to integer type with parseInt to avoid any decimal issues
        characterData.raiderIoScore = parseInt(characterData.raiderIoScore.toString());
        
        console.log(`MySQL updateCharacter - Converted score to integer: ${characterData.raiderIoScore}`);
      }
      
      const db = await getDb();
      
      // Update the character
      await db
        .update(schema.characters)
        .set(characterData)
        .where(eq(schema.characters.id, id));
      
      // Then retrieve the updated character
      const [updatedCharacter] = await db
        .select()
        .from(schema.characters)
        .where(eq(schema.characters.id, id));
      
      return updatedCharacter;
    } catch (error) {
      console.error("Error updating character:", error);
      throw new Error(`Failed to update character: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Override updateGuild to handle the lack of returning() in MySQL
   */
  async updateGuild(id: number, guildData: Partial<schema.InsertGuild>): Promise<schema.Guild | undefined> {
    try {
      console.log('MySQL updateGuild - Updating guild ID:', id, 'with data:', guildData);
      const db = await getDb();
      
      // Update the guild record
      await db
        .update(schema.guilds)
        .set(guildData)
        .where(eq(schema.guilds.id, id));
      
      // Then retrieve the updated guild
      const [updatedGuild] = await db
        .select()
        .from(schema.guilds)
        .where(eq(schema.guilds.id, id));
      
      return updatedGuild;
    } catch (error) {
      console.error("Error updating guild:", error);
      throw new Error(`Failed to update guild: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  /**
   * Override createRaidBoss to handle the lack of returning() in MySQL
   */
  async createRaidBoss(raidBoss: schema.InsertRaidBoss): Promise<schema.RaidBoss> {
    try {
      const db = await getDb();
      
      // Handle the MySQL specifics - MySQL doesn't support returning()
      // Insert first
      const result = await db
        .insert(schema.raidBosses)
        .values(raidBoss);
      
      // Then retrieve the inserted item by its unique properties
      const [insertedBoss] = await db
        .select()
        .from(schema.raidBosses)
        .where(
          eq(schema.raidBosses.name, raidBoss.name as string) && 
          eq(schema.raidBosses.raidName, raidBoss.raidName as string) &&
          eq(schema.raidBosses.difficulty, raidBoss.difficulty as string)
        );
        
      return insertedBoss;
    } catch (error) {
      console.error("Error creating raid boss:", error);
      throw new Error(`Failed to create raid boss: ${error}`);
    }
  }
  
  /**
   * Override updateRaidBoss to handle lack of returning() in MySQL
   */
  async updateRaidBoss(id: number, raidBossData: Partial<schema.InsertRaidBoss>): Promise<schema.RaidBoss | undefined> {
    try {
      console.log('MySQL updateRaidBoss - Updating boss ID:', id, 'with data:', raidBossData);
      const db = await getDb();
      
      // Update the raid boss
      await db
        .update(schema.raidBosses)
        .set(raidBossData)
        .where(eq(schema.raidBosses.id, id));
      
      // Then retrieve the updated boss
      console.log('MySQL updateRaidBoss - Retrieving updated boss ID:', id);
      const [updatedBoss] = await db
        .select()
        .from(schema.raidBosses)
        .where(eq(schema.raidBosses.id, id));
      
      if (!updatedBoss) {
        console.warn('MySQL updateRaidBoss - Boss not found after update, ID:', id);
      }
        
      return updatedBoss;
    } catch (error) {
      console.error("Error updating raid boss:", error);
      throw new Error(`Failed to update raid boss: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Override deleteRaidBoss to handle lack of returning() in MySQL
   */
  async deleteRaidBoss(id: number): Promise<boolean> {
    try {
      console.log('MySQL deleteRaidBoss - Deleting boss ID:', id);
      const db = await getDb();
      
      // Check if the boss exists before deleting
      const [existingBoss] = await db
        .select()
        .from(schema.raidBosses)
        .where(eq(schema.raidBosses.id, id));
      
      if (!existingBoss) {
        console.warn('MySQL deleteRaidBoss - Boss not found, ID:', id);
        return false;
      }
      
      // Delete the boss
      await db
        .delete(schema.raidBosses)
        .where(eq(schema.raidBosses.id, id));
      
      return true;
    } catch (error) {
      console.error("Error deleting raid boss:", error);
      throw new Error(`Failed to delete raid boss: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Override getRaidBossesByGuildId to handle schema differences between MySQL and PostgreSQL
   */
  async getRaidBossesByGuildId(
    guildId: number, 
    raidName?: string, 
    difficulty: string = 'mythic'
  ): Promise<schema.RaidBoss[]> {
    try {
      console.log(`Fetching raid bosses for guild ${guildId}, difficulty: ${difficulty}`);
      
      // Fall back to basic query if we encounter schema issues
      try {
        // First attempt with a full query
        return await this.getRaidBossesAdvanced(guildId, raidName, difficulty);
      } catch (advancedError) {
        console.warn('Advanced query failed, falling back to basic query:', advancedError);
        
        // If the advanced query fails (likely due to missing columns), try a basic query
        return await this.getRaidBossesBasic(guildId, raidName, difficulty);
      }
    } catch (error) {
      console.error('Error fetching raid bosses:', error);
      
      // Return empty array instead of throwing to prevent application failures
      console.log('Returning empty array as fallback for raid bosses');
      return [];
    }
  }
  
  /**
   * Advanced version that uses all columns
   */
  private async getRaidBossesAdvanced(
    guildId: number, 
    raidName?: string, 
    difficulty: string = 'mythic'
  ): Promise<schema.RaidBoss[]> {
    // For MySQL, we need to use raw SQL to only select columns that actually exist in the table
    // This works around schema differences between PostgreSQL and MySQL
    let sqlQuery = `
      SELECT 
        id, name, raid_name, icon_url, 
        pull_count, defeated, in_progress, 
        difficulty, guild_id, last_updated, 
        boss_id, encounter_id, warcraftlogs_id, 
        dps_ranking, healing_ranking, tank_ranking, 
        last_kill_date, kill_count, report_url,
        best_time, best_parse, fastest_kill,
        raider_io_data, warcraft_logs_data
      FROM 
        raid_bosses 
      WHERE 
        difficulty = ?
    `;
    
    const params = [difficulty];
    
    if (raidName) {
      sqlQuery += " AND raid_name = ?";
      params.push(raidName);
    }
    
    if (guildId) {
      sqlQuery += " AND guild_id = ?";
      params.push(guildId.toString());
    }
    
    // Execute the raw SQL query to avoid schema differences
    // Use the pool from the imported db above
    console.log('MySQL raid_bosses advanced query:', sqlQuery, 'with params:', params);
    const result = await pool.query(sqlQuery, params);
    
    // The result is in the first element of the array
    const bosses = Array.isArray(result) && result.length > 0 ? result[0] : [];
    
    // Transform MySQL's snake_case keys to camelCase to match the expected types
    const transformedBosses = (bosses as any[]).map(boss => {
      // Convert snake_case to camelCase
      const transformed: any = {};
      Object.keys(boss).forEach(key => {
        // Handle special cases for snake_case keys
        if (key === 'raid_name') transformed.raidName = boss[key];
        else if (key === 'icon_url') transformed.iconUrl = boss[key];
        else if (key === 'pull_count') transformed.pullCount = boss[key] === 0 ? null : boss[key];
        else if (key === 'in_progress') transformed.inProgress = boss[key];
        else if (key === 'guild_id') transformed.guildId = boss[key];
        else if (key === 'last_updated') transformed.lastUpdated = boss[key];
        else if (key === 'boss_id') transformed.bossId = boss[key];
        else if (key === 'encounter_id') transformed.encounterId = boss[key];
        else if (key === 'warcraftlogs_id') transformed.warcraftlogsId = boss[key];
        else if (key === 'dps_ranking') transformed.dpsRanking = boss[key] === 0 ? null : boss[key];
        else if (key === 'healing_ranking') transformed.healingRanking = boss[key] === 0 ? null : boss[key];
        else if (key === 'tank_ranking') transformed.tankRanking = boss[key] === 0 ? null : boss[key];
        else if (key === 'last_kill_date') transformed.lastKillDate = boss[key];
        else if (key === 'kill_count') transformed.killCount = boss[key] === 0 ? null : boss[key];
        else if (key === 'report_url') transformed.reportUrl = boss[key];
        else if (key === 'best_time') transformed.bestTime = boss[key] === 0 ? null : boss[key];
        else if (key === 'best_parse') transformed.bestParse = boss[key] === 0 ? null : boss[key];
        else if (key === 'fastest_kill') transformed.fastestKill = boss[key] === 0 ? null : boss[key];
        else if (key === 'raider_io_data') {
          try {
            transformed.raiderIoData = typeof boss[key] === 'string' ? 
              JSON.parse(boss[key]) : boss[key];
          } catch (e) {
            transformed.raiderIoData = null;
          }
        }
        else if (key === 'warcraft_logs_data') {
          try {
            transformed.warcraftLogsData = typeof boss[key] === 'string' ? 
              JSON.parse(boss[key]) : boss[key];
          } catch (e) {
            transformed.warcraftLogsData = null;
          }
        }
        else if (key === 'defeated') {
          // Convert 0 to null for defeated status to prevent it from appearing in the UI
          transformed.defeated = boss[key] === 0 ? null : boss[key];
        }
        else transformed[key] = boss[key]; // For keys that are already camelCase
      });
      return transformed;
    });
    
    // Sort results in JavaScript
    return (transformedBosses as schema.RaidBoss[]).sort((a: any, b: any) => {
      // First by raid_name
      if (a.raidName !== b.raidName) {
        return a.raidName.localeCompare(b.raidName);
      }
      // Then by boss order
      return (a.bossId || 0) - (b.bossId || 0);
    });
  }
  
  /**
   * Simplified version that uses only basic columns guaranteed to exist
   */
  private async getRaidBossesBasic(
    guildId: number, 
    raidName?: string, 
    difficulty: string = 'mythic'
  ): Promise<schema.RaidBoss[]> {
    // Minimal columns that should exist in both databases
    let sqlQuery = `
      SELECT 
        id, name, raid_name, icon_url, 
        defeated, in_progress, difficulty, 
        guild_id, last_updated, boss_id
      FROM 
        raid_bosses 
      WHERE 
        difficulty = ?
    `;
    
    const params = [difficulty];
    
    if (raidName) {
      sqlQuery += " AND raid_name = ?";
      params.push(raidName);
    }
    
    if (guildId) {
      sqlQuery += " AND guild_id = ?";
      params.push(guildId.toString());
    }
    
    // Execute the raw SQL query using imported pool
    console.log('MySQL raid_bosses basic query:', sqlQuery, 'with params:', params);
    const result = await pool.query(sqlQuery, params);
    
    // The result is in the first element of the array
    const bosses = Array.isArray(result) && result.length > 0 ? result[0] : [];
    
    // Transform MySQL's snake_case keys to camelCase to match the expected types
    const transformedBosses = (bosses as any[]).map(boss => {
      const transformed: any = {};
      Object.keys(boss).forEach(key => {
        // Handle special cases for snake_case keys
        if (key === 'raid_name') transformed.raidName = boss[key];
        else if (key === 'icon_url') transformed.iconUrl = boss[key];
        else if (key === 'in_progress') transformed.inProgress = boss[key];
        else if (key === 'guild_id') transformed.guildId = boss[key];
        else if (key === 'last_updated') transformed.lastUpdated = boss[key];
        else if (key === 'boss_id') transformed.bossId = boss[key];
        else if (key === 'defeated') {
          // Convert 0 to null for defeated status to prevent it from appearing in the UI
          transformed.defeated = boss[key] === 0 ? null : boss[key];
        }
        else transformed[key] = boss[key]; // For keys that are already camelCase
      });
      return transformed;
    });
    
    // Sort results in JavaScript
    return (transformedBosses as schema.RaidBoss[]).sort((a: any, b: any) => {
      // First by raid_name
      if (a.raidName !== b.raidName) {
        return a.raidName.localeCompare(b.raidName);
      }
      // Then by boss order
      return (a.bossId || 0) - (b.bossId || 0);
    });
  }
  
  /**
   * Override createApplication to handle the lack of returning() in MySQL
   */
  async createApplication(application: schema.InsertApplication): Promise<schema.Application> {
    try {
      const db = await getDb();
      console.log('MySQL createApplication - Creating application:', application);
      
      // Handle the MySQL specifics - MySQL doesn't support returning()
      // Insert first
      const result = await db
        .insert(schema.applications)
        .values({
          ...application,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      
      // Get the ID of the inserted record
      const insertId = result[0].insertId;
      
      // Then retrieve the inserted item by its ID
      const [insertedApp] = await db
        .select()
        .from(schema.applications)
        .where(eq(schema.applications.id, insertId));
        
      console.log('MySQL createApplication - Created application:', insertedApp);
      return insertedApp;
    } catch (error) {
      console.error("Error creating application:", error);
      throw new Error(`Failed to create application: ${error}`);
    }
  }
  
  /**
   * Override updateApplication to handle lack of returning() in MySQL
   */
  async updateApplication(id: number, applicationData: Partial<schema.InsertApplication>): Promise<schema.Application | undefined> {
    try {
      const db = await getDb();
      console.log('MySQL updateApplication - Updating application ID:', id, 'with data:', applicationData);
      
      // Update the record
      await db
        .update(schema.applications)
        .set({
          ...applicationData,
          updatedAt: new Date()
        })
        .where(eq(schema.applications.id, id));
      
      // Retrieve the updated record
      const [updatedApplication] = await db
        .select()
        .from(schema.applications)
        .where(eq(schema.applications.id, id));
      
      return updatedApplication;
    } catch (error) {
      console.error("Error updating application:", error);
      return undefined;
    }
  }
  
  /**
   * Override changeApplicationStatus to handle the lack of returning() in MySQL
   */
  async changeApplicationStatus(id: number, status: string, reviewedBy: number, reviewNotes?: string): Promise<schema.Application | undefined> {
    try {
      console.log('MySQL changeApplicationStatus - Updating application ID:', id, 'with status:', status);
      const db = await getDb();
      
      // Update the application status
      await db
        .update(schema.applications)
        .set({
          status,
          reviewedBy,
          reviewNotes,
          reviewDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(schema.applications.id, id));
      
      // Then retrieve the updated application
      const [updatedApplication] = await db
        .select()
        .from(schema.applications)
        .where(eq(schema.applications.id, id));
      
      return updatedApplication;
    } catch (error) {
      console.error("Error updating application status:", error);
      throw new Error(`Failed to update application status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Override createApplicationComment to handle the lack of returning() in MySQL
   */
  async createApplicationComment(comment: schema.InsertApplicationComment): Promise<schema.ApplicationComment> {
    try {
      console.log('MySQL createApplicationComment - Creating comment:', comment);
      const db = await getDb();
      
      // Insert first
      const result = await db
        .insert(schema.applicationComments)
        .values({
          ...comment,
          createdAt: new Date()
        });
      
      // Get the ID of the inserted record
      const insertId = result[0].insertId;
      
      // Then retrieve the inserted comment by its ID
      const [createdComment] = await db
        .select()
        .from(schema.applicationComments)
        .where(eq(schema.applicationComments.id, insertId));
      
      return createdComment;
    } catch (error) {
      console.error("Error creating application comment:", error);
      throw new Error(`Failed to create application comment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Override getApplicationComments to handle MySQL specifics
   */
  async getApplicationComments(applicationId: number): Promise<(schema.ApplicationComment & { adminUsername?: string })[]> {
    try {
      console.log('MySQL getApplicationComments - Fetching comments for application ID:', applicationId);
      
      // For MySQL, we need a custom query to join the tables
      const sqlQuery = `
        SELECT 
          ac.*,
          au.username as admin_username
        FROM 
          application_comments ac
        LEFT JOIN 
          admin_users au ON ac.admin_id = au.id
        WHERE 
          ac.application_id = ?
        ORDER BY 
          ac.created_at ASC
      `;
      
      // Execute the SQL query
      const result = await pool.query(sqlQuery, [applicationId]);
      
      // The result is in the first element of the array
      const comments = Array.isArray(result) && result.length > 0 ? result[0] : [];
      
      // Transform MySQL's snake_case keys to camelCase
      return (comments as any[]).map(comment => {
        const transformed: any = {};
        Object.keys(comment).forEach(key => {
          if (key === 'application_id') transformed.applicationId = comment[key];
          else if (key === 'admin_id') transformed.adminId = comment[key];
          else if (key === 'created_at') transformed.createdAt = comment[key];
          else if (key === 'admin_username') transformed.adminUsername = comment[key];
          else transformed[key] = comment[key];
        });
        return transformed;
      });
    } catch (error) {
      console.error("Error fetching application comments:", error);
      throw new Error(`Failed to fetch application comments: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Override getApplications to handle schema differences in MySQL
   */
  async getApplications(status?: string): Promise<schema.Application[]> {
    try {
      // Use raw SQL to select only the columns that are known to exist in both schemas
      let sqlQuery = `
        SELECT 
          id, character_name, realm, item_level, 
          experience, availability, contact_info, 
          why_join, raiders_known, referred_by, 
          additional_info, logs, status, 
          reviewed_by, review_notes, review_date, 
          created_at, updated_at
        FROM 
          applications
      `;
      
      const params = [];
      
      if (status) {
        sqlQuery += " WHERE status = ?";
        params.push(status);
      }
      
      sqlQuery += " ORDER BY created_at DESC";
      
      // Execute the raw SQL query using imported pool
      const result = await pool.query(sqlQuery, params);
      
      // The result is in the first element of the array
      const applications = Array.isArray(result) && result.length > 0 ? result[0] : [];
      
      // Transform MySQL's snake_case keys to camelCase to match the expected types
      const transformedApplications = (applications as any[]).map(app => {
        const transformed: any = {};
        Object.keys(app).forEach(key => {
          // Handle special cases for snake_case keys
          if (key === 'character_name') transformed.characterName = app[key];
          else if (key === 'item_level') transformed.itemLevel = app[key];
          else if (key === 'contact_info') transformed.contactInfo = app[key];
          else if (key === 'why_join') transformed.whyJoin = app[key];
          else if (key === 'raiders_known') transformed.raidersKnown = app[key];
          else if (key === 'referred_by') transformed.referredBy = app[key];
          else if (key === 'additional_info') transformed.additionalInfo = app[key];
          else if (key === 'review_notes') transformed.reviewNotes = app[key];
          else if (key === 'review_date') transformed.reviewDate = app[key];
          else if (key === 'created_at') transformed.createdAt = app[key];
          else if (key === 'updated_at') transformed.updatedAt = app[key];
          else if (key === 'reviewed_by') transformed.reviewedBy = app[key];
          else if (key === 'class_name') transformed.className = app[key];
          else if (key === 'spec_name') transformed.specName = app[key];
          else transformed[key] = app[key]; // For keys that are already camelCase
        });
        return transformed;
      });
      
      return transformedApplications as schema.Application[];
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw new Error(`Failed to fetch applications: ${error}`);
    }
  }
  
  /**
   * Override getAllAdminUsers to handle MySQL-specific ordering
   * Also optimized to use efficient COUNT(*) when we just need to check for existence
   */
  async getAllAdminUsers(countOnly: boolean = false): Promise<schema.AdminUser[]> {
    try {
      // For MySQL, we can optimize this query when we only need the count
      if (countOnly) {
        console.log('MySQL getAllAdminUsers - Optimized count-only query');
        const countResult = await pool.query('SELECT COUNT(*) as count FROM admin_users');
        const count = countResult[0][0].count;
        
        // Return an array with empty objects just to match the length expected
        return Array(count).fill({}) as schema.AdminUser[];
      }
      
      // Otherwise, fetch all users
      const db = await getDb();
      
      // Use explicit column for ordering to avoid complex object parameter issues
      const users = await db
        .select()
        .from(schema.adminUsers)
        .orderBy(asc(schema.adminUsers.username));
      
      return users;
    } catch (error) {
      console.error("Error fetching admin users:", error);
      throw new Error(`Failed to fetch admin users: ${error}`);
    }
  }

  /**
   * Override createAdminUser to handle the lack of returning() in MySQL
   */
  async createAdminUser(adminUser: schema.InsertAdminUser): Promise<schema.AdminUser> {
    try {
      const db = await getDb();
      
      // Insert the admin user
      console.log('MySQL createAdminUser - Inserting admin user:', adminUser.username);
      await db
        .insert(schema.adminUsers)
        .values(adminUser);
      
      // Then retrieve the inserted user by username (which is unique)
      console.log('MySQL createAdminUser - Retrieving newly created admin user:', adminUser.username);
      const [insertedUser] = await db
        .select()
        .from(schema.adminUsers)
        .where(eq(schema.adminUsers.username, adminUser.username));
        
      return insertedUser;
    } catch (error) {
      console.error("Error creating admin user:", error);
      throw new Error(`Failed to create admin user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Override updateAdminUser to handle the lack of returning() in MySQL
   */
  async updateAdminUser(id: number, adminUserData: Partial<schema.InsertAdminUser>): Promise<schema.AdminUser | undefined> {
    try {
      const db = await getDb();
      
      // Update the admin user
      console.log('MySQL updateAdminUser - Updating admin user ID:', id);
      await db
        .update(schema.adminUsers)
        .set(adminUserData)
        .where(eq(schema.adminUsers.id, id));
      
      // Then retrieve the updated user
      console.log('MySQL updateAdminUser - Retrieving updated admin user ID:', id);
      const [updatedUser] = await db
        .select()
        .from(schema.adminUsers)
        .where(eq(schema.adminUsers.id, id));
        
      return updatedUser;
    } catch (error) {
      console.error("Error updating admin user:", error);
      throw new Error(`Failed to update admin user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Override deleteAdminUser to handle MySQL specifics
   */
  async deleteAdminUser(id: number): Promise<boolean> {
    try {
      const db = await getDb();
      
      // Check if the user exists before deleting
      const [existingUser] = await db
        .select()
        .from(schema.adminUsers)
        .where(eq(schema.adminUsers.id, id));
      
      if (!existingUser) {
        return false;
      }
      
      // Delete the admin user
      console.log('MySQL deleteAdminUser - Deleting admin user ID:', id);
      await db
        .delete(schema.adminUsers)
        .where(eq(schema.adminUsers.id, id));
      
      return true;
    } catch (error) {
      console.error("Error deleting admin user:", error);
      throw new Error(`Failed to delete admin user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Override getAdminUserByUsername to handle MySQL specifics
   * Makes username lookup case-insensitive
   */
  async getAdminUserByUsername(username: string): Promise<schema.AdminUser | undefined> {
    try {
      const db = await getDb();
      
      console.log('MySQL getAdminUserByUsername - Fetching admin user:', username);
      
      // Use MySQL's LOWER() function for case-insensitive comparison
      const [user] = await db
        .select()
        .from(schema.adminUsers)
        .where(sql`LOWER(${schema.adminUsers.username}) = LOWER(${username})`);
      
      return user;
    } catch (error) {
      console.error("Error fetching admin user by username:", error);
      throw new Error(`Failed to fetch admin user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Override getAdminUserById to handle MySQL specifics
   */
  async getAdminUserById(id: number): Promise<schema.AdminUser | undefined> {
    try {
      const db = await getDb();
      
      console.log('MySQL getAdminUserById - Fetching admin user ID:', id);
      const [user] = await db
        .select()
        .from(schema.adminUsers)
        .where(eq(schema.adminUsers.id, id));
      
      return user;
    } catch (error) {
      console.error("Error fetching admin user by ID:", error);
      throw new Error(`Failed to fetch admin user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Override verifyAdminCredentials to handle MySQL specifics
   */
  async verifyAdminCredentials(username: string, password: string): Promise<schema.AdminUser | undefined> {
    try {
      // Get the user first
      const user = await this.getAdminUserByUsername(username);
      
      if (!user) {
        console.log('MySQL verifyAdminCredentials - User not found:', username);
        return undefined;
      }
      
      // When verifying credentials, update the lastLogin field if successful
      // We implement this in the storage layer to keep the adminAuth.ts implementation database-agnostic
      const compareResult = await this.comparePasswords(password, user.password);
      
      if (compareResult) {
        console.log('MySQL verifyAdminCredentials - Password verified for user:', username);
        
        // Update last login time
        const db = await getDb();
        await db
          .update(schema.adminUsers)
          .set({ lastLogin: new Date() })
          .where(eq(schema.adminUsers.id, user.id));
        
        // Re-fetch the user to get the updated lastLogin
        const [updatedUser] = await db
          .select()
          .from(schema.adminUsers)
          .where(eq(schema.adminUsers.id, user.id));
        
        return updatedUser;
      } else {
        console.log('MySQL verifyAdminCredentials - Password verification failed for user:', username);
        return undefined;
      }
    } catch (error) {
      console.error("Error verifying admin credentials:", error);
      throw new Error(`Failed to verify admin credentials: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Helper method to compare password with stored hash
   * This is a utility method for verifyAdminCredentials
   */
  private async comparePasswords(suppliedPassword: string, storedHash: string): Promise<boolean> {
    try {
      // Split the stored hash into the hash and salt
      const [hashed, salt] = storedHash.split('.');
      
      if (!hashed || !salt) {
        console.error('Invalid stored hash format');
        return false;
      }
      
      // Import crypto to hash the password
      const crypto = await import('crypto');
      const hashedBuf = Buffer.from(hashed, "hex");
      
      // Hash the supplied password with the same salt
      const suppliedBuf = crypto.scryptSync(suppliedPassword, salt, 64) as Buffer;
      
      // Compare the two buffers using a timing-safe comparison
      return crypto.timingSafeEqual(hashedBuf, suppliedBuf);
    } catch (error) {
      console.error('Error comparing passwords:', error);
      return false;
    }
  }

  /**
   * MySQL version of verifyGuildMembership
   * Verifies if a user is a guild member by checking if any of their 
   * characters match with characters in our guild roster database
   * 
   * @param userId The user ID to check
   * @returns True if the user is a guild member, false otherwise
   */
  async verifyGuildMembership(userId: number): Promise<boolean> {
    try {
      console.log(`MySQL: Verifying guild membership for user ID: ${userId}`);
      
      // First, get all the user's characters
      const userChars = await this.getUserCharacters(userId);
      if (!userChars || userChars.length === 0) {
        console.log(`MySQL: No characters found for user ID: ${userId}`);
        await this.updateUser(userId, { isGuildMember: false });
        return false;
      }
      
      // Get the guild ID - assuming there's only one guild in the system
      const db = await getDb();
      const [guild] = await db.select().from(schema.guilds).limit(1);
      
      if (!guild) {
        console.log('MySQL: No guild found in the system');
        return false;
      }
      
      // More efficient approach: check if any of the user's characters exist in our guild roster
      let isGuildMember = false;
      
      // Extract character names and realms from user's characters
      for (const char of userChars) {
        // Direct database check if this character exists in the guild roster
        const [guildCharacter] = await db
          .select()
          .from(schema.characters)
          .where(and(
            eq(schema.characters.name, char.name),
            eq(schema.characters.realm, char.realm),
            eq(schema.characters.guildId, guild.id)
          ))
          .limit(1);
        
        if (guildCharacter) {
          console.log(`MySQL: Character ${char.name}-${char.realm} found in guild roster`);
          isGuildMember = true;
          break;
        }
      }
      
      // Update user's guild membership status
      await this.updateUser(userId, { isGuildMember });
      
      console.log(`MySQL: User ${userId} guild membership verification result: ${isGuildMember}`);
      return isGuildMember;
    } catch (error) {
      console.error('MySQL: Error verifying guild membership:', error);
      return false;
    }
  }
}