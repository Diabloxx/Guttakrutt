import { eq, sql, and, like, desc, or, asc, lt, gte, lte, count } from 'drizzle-orm';
import {
  guilds, characters, raidProgresses as raidProgress, raidBosses, adminUsers, applications, applicationComments, applicationNotifications,
  websiteContent, mediaFiles, websiteSettings, translations, webLogs, users, userCharacters,
  type Guild, type InsertGuild, type Character, type InsertCharacter, type RaidProgress, type InsertRaidProgress,
  type RaidBoss, type InsertRaidBoss, type AdminUser, type InsertAdminUser, type Application, type InsertApplication,
  type ApplicationComment, type InsertApplicationComment, type ApplicationNotification, type InsertApplicationNotification,
  type WebsiteContent, type InsertWebsiteContent, type MediaFile, type InsertMediaFile, 
  type WebsiteSetting, type InsertWebsiteSetting, type Translation, type InsertTranslation,
  type WebLog, type InsertWebLog, type User, type InsertUser, type UserCharacter, type InsertUserCharacter
} from '@shared/schema';
import { IStorage } from './storage';
import { getDb } from './db';
import { getDbConnection, isMySql } from './db-connector';
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// Promisify scrypt
const scryptAsync = promisify(scrypt);

/**
 * DatabaseStorage implementation using Drizzle ORM to interact with the database
 */
export class DatabaseStorage {
  // The sessionStore property is implemented in the StorageWithSession class that extends this class
  sessionStore!: any; // This is just to satisfy TypeScript
  
  // User operations for authentication
  async getUser(id: number): Promise<User | undefined> {
    try {
      const db = await getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return undefined;
    }
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const db = await getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const db = await getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async getUserByBattleNetId(battleNetId: string): Promise<User | undefined> {
    console.log(`Getting user by Battle.net ID: ${battleNetId}`);
    
    try {
      const db = await getDb();
      
      // First try using the camelCase field (standard schema)
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.battleNetId, battleNetId));
      
      if (user) {
        console.log(`Found user with camelCase battleNetId: ${user.id}`);
        return user;
      }
      
      console.log('User not found with camelCase battleNetId, trying alternatives');
      
      // If camelCase lookup fails, try a more compatible approach based on database type
      if (isMySql()) {
        // For MySQL, try the snake_case version
        console.log('Using MySQL-specific query for battle_net_id');
        
        try {
          // Use SQL directly for MySQL to ensure we can query by the correct field name
          const result = await db.execute(
            sql`SELECT * FROM users WHERE battle_net_id = ${battleNetId}`
          );
          
          if (result && result.rows && result.rows.length > 0) {
            const user = result.rows[0] as User;
            console.log(`Found user with snake_case battle_net_id: ${user.id}`);
            return user;
          }
        } catch (mysqlError) {
          console.error('MySQL-specific query error:', mysqlError);
        }
      } else {
        // For PostgreSQL, try a case-insensitive query as a last resort
        console.log('Using PostgreSQL fallback query');
        
        try {
          const connection = await getDbConnection();
          // Use parameterized query with proper quotes for PostgreSQL
          const query = `SELECT * FROM "users" WHERE "battleNetId" = $1 LIMIT 1`;
          const result = await connection.query(query, [battleNetId]);
          
          if (result.rows && result.rows.length > 0) {
            const user = result.rows[0] as User;
            console.log(`Found user with PostgreSQL direct query: ${user.id}`);
            return user;
          }
        } catch (pgError) {
          console.error('PostgreSQL fallback query error:', pgError);
        }
      }
      
      console.log(`No user found with Battle.net ID: ${battleNetId}`);
      return undefined;
    } catch (error) {
      console.error('Error in getUserByBattleNetId:', error);
      return undefined;
    }
  }

  async getUserByBattleTag(battleTag: string): Promise<User | undefined> {
    console.log(`Getting user by Battle Tag: ${battleTag}`);
    
    try {
      const db = await getDb();
      
      // First try using the camelCase field (standard schema)
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.battleTag, battleTag));
      
      if (user) {
        console.log(`Found user with exact battleTag match: ${user.id}`);
        return user;
      }
      
      console.log('User not found with exact battleTag match, trying alternatives');
      
      // If exact match fails, try a more compatible approach based on database type
      if (isMySql()) {
        // For MySQL, try case-insensitive match
        console.log('Using MySQL-specific query for battle_tag');
        
        try {
          // Use SQL directly for MySQL to ensure case-insensitive comparison
          const result = await db.execute(
            sql`SELECT * FROM users WHERE LOWER(battle_tag) = LOWER(${battleTag})`
          );
          
          if (result && result.rows && result.rows.length > 0) {
            const user = result.rows[0] as User;
            console.log(`Found user with MySQL case-insensitive battle_tag: ${user.id}`);
            return user;
          }
        } catch (mysqlError) {
          console.error('MySQL-specific battle_tag query error:', mysqlError);
        }
      } else {
        // For PostgreSQL, try a case-insensitive query
        console.log('Using PostgreSQL case-insensitive battleTag query');
        
        try {
          const connection = await getDbConnection();
          // Use parameterized query with LOWER function for PostgreSQL
          const query = `SELECT * FROM "users" WHERE LOWER("battleTag") = LOWER($1) LIMIT 1`;
          const result = await connection.query(query, [battleTag]);
          
          if (result.rows && result.rows.length > 0) {
            const user = result.rows[0] as User;
            console.log(`Found user with PostgreSQL case-insensitive battleTag: ${user.id}`);
            return user;
          }
        } catch (pgError) {
          console.error('PostgreSQL battleTag query error:', pgError);
        }
      }
      
      console.log(`No user found with Battle Tag: ${battleTag}`);
      return undefined;
    } catch (error) {
      console.error('Error in getUserByBattleTag:', error);
      return undefined;
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    const db = await getDb();
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const db = await getDb();
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserTokens(id: number, accessToken: string, refreshToken: string, tokenExpiry: Date): Promise<User | undefined> {
    return this.updateUser(id, {
      accessToken,
      refreshToken,
      tokenExpiry,
      lastLogin: new Date()
    });
  }
  
  async updateUserLastLogin(id: number): Promise<User | undefined> {
    try {
      const db = await getDb();
      const [user] = await db
        .update(users)
        .set({
          lastLogin: new Date()
        })
        .where(eq(users.id, id))
        .returning();
      return user;
    } catch (error) {
      console.error('Error updating user last login:', error);
      return undefined;
    }
  }
  
  async connectBattleNetAccount(userId: number, battleNetId: string, battleTag: string, accessToken: string, refreshToken: string, tokenExpiry: Date): Promise<User | undefined> {
    try {
      console.log(`Connecting Battle.net account (${battleNetId}, ${battleTag}) to user ID ${userId}`);
      
      // First, check if the Battle.net ID is already connected to another account
      const existingUser = await this.getUserByBattleNetId(battleNetId);
      if (existingUser && existingUser.id !== userId) {
        console.warn(`Battle.net ID ${battleNetId} is already connected to user ID ${existingUser.id}`);
        throw new Error('This Battle.net account is already connected to another user account');
      }
      
      // Update the user with the Battle.net info
      const db = await getDb();
      
      // Create update data object with both camelCase and snake_case fields for compatibility
      const updateData: any = {
        // CamelCase fields (standard)
        battleNetId,
        battleTag,
        accessToken,
        refreshToken,
        tokenExpiry,
        lastLogin: new Date()
      };
      
      // Add snake_case fields for MySQL compatibility if needed
      if (isMySql()) {
        console.log(`PostgreSQL connectBattleNetAccount: Adding snake_case fields for MySQL compatibility: battle_tag=${battleTag}`);
        updateData.battle_net_id = battleNetId;
        updateData.battle_tag = battleTag;
        updateData.access_token = accessToken;
        updateData.refresh_token = refreshToken;
        updateData.token_expiry = tokenExpiry;
        updateData.last_login = new Date();
      }
      
      // Perform the update and return the user
      const [user] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();
      
      // Log success with the battle tag for debugging
      if (user) {
        console.log(`Successfully connected Battle.net account to user ID ${userId}. User now has Battle Tag: ${user.battleTag || user.battle_tag}`);
      } else {
        console.error(`Failed to connect Battle.net account to user ID ${userId}. Update did not return a user.`);
      }
      
      return user;
    } catch (error) {
      console.error('Error connecting Battle.net account:', error);
      throw error;
    }
  }
  
  /**
   * Updates user's Battle.net data with refreshed values
   * Used to automatically update BattleTag when user logs in
   */
  async updateUserBattleNetData(
    userId: number,
    data: {
      battleTag?: string;
      [key: string]: any;
    }
  ): Promise<User | undefined> {
    console.log(`Updating Battle.net data for user ID ${userId}`);
    
    try {
      const db = await getDb();
      
      // Create update data object with both camelCase and snake_case fields for compatibility
      const updateData: any = {
        // Include standard fields that are provided
        ...(data.battleTag && { battleTag: data.battleTag }),
      };
      
      // Add other fields from data object
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'battleTag') {
          updateData[key] = value;
        }
      });
      
      // Add snake_case fields for MySQL compatibility if needed
      if (isMySql() && data.battleTag) {
        console.log(`Adding snake_case field for MySQL compatibility: battle_tag=${data.battleTag}`);
        updateData.battle_tag = data.battleTag;
      }
      
      // Perform the update and return the user
      const [user] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();
      
      // Log success with the battle tag for debugging
      if (user) {
        console.log(`Successfully updated Battle.net data for user ID ${userId}`);
        if (data.battleTag) {
          console.log(`Updated Battle Tag: ${user.battleTag || user.battle_tag}`);
        }
      } else {
        console.error(`Failed to update Battle.net data for user ID ${userId}. Update did not return a user.`);
      }
      
      return user;
    } catch (error) {
      console.error('Error updating Battle.net data:', error);
      throw error;
    }
  }

  // User-Character relationships
  async getUserCharacters(userId: number): Promise<(Character & { isMain: boolean, verified: boolean })[]> {
    const db = await getDb();
    const userChars = await db
      .select({
        ...characters,
        isMain: userCharacters.isMain,
        verified: userCharacters.verified
      })
      .from(userCharacters)
      .innerJoin(characters, eq(userCharacters.characterId, characters.id))
      .where(eq(userCharacters.userId, userId));
    return userChars;
  }

  async linkCharacterToUser(linkData: InsertUserCharacter): Promise<UserCharacter> {
    const db = await getDb();
    const [link] = await db
      .insert(userCharacters)
      .values(linkData)
      .returning();
    return link;
  }

  async verifyCharacterOwnership(userId: number, characterId: number): Promise<boolean> {
    const db = await getDb();
    const result = await db
      .update(userCharacters)
      .set({ 
        verified: true,
        verifiedAt: new Date()
      })
      .where(
        and(
          eq(userCharacters.userId, userId),
          eq(userCharacters.characterId, characterId)
        )
      );
    return !!result;
  }

  async setMainCharacter(userId: number, characterId: number): Promise<boolean> {
    const db = await getDb();
    
    // First, set all characters to isMain = false
    await db
      .update(userCharacters)
      .set({ isMain: false })
      .where(eq(userCharacters.userId, userId));
    
    // Then set the selected character as main
    const result = await db
      .update(userCharacters)
      .set({ isMain: true })
      .where(
        and(
          eq(userCharacters.userId, userId),
          eq(userCharacters.characterId, characterId)
        )
      );
    
    return !!result;
  }

  async userOwnsCharacter(userId: number, characterId: number): Promise<boolean> {
    const db = await getDb();
    const [link] = await db
      .select()
      .from(userCharacters)
      .where(
        and(
          eq(userCharacters.userId, userId),
          eq(userCharacters.characterId, characterId)
        )
      );
    return !!link;
  }

  async getUserMainCharacter(userId: number): Promise<(Character & { isMain: boolean, verified: boolean }) | undefined> {
    const db = await getDb();
    const [userChar] = await db
      .select({
        ...characters,
        isMain: userCharacters.isMain,
        verified: userCharacters.verified
      })
      .from(userCharacters)
      .innerJoin(characters, eq(userCharacters.characterId, characters.id))
      .where(
        and(
          eq(userCharacters.userId, userId),
          eq(userCharacters.isMain, true)
        )
      );
    return userChar;
  }
  
  // Website Content Management Methods
  // Guild operations
  async getGuild(id: number): Promise<Guild | undefined> {
    const db = await getDb();
    const [guild] = await db
      .select()
      .from(guilds)
      .where(eq(guilds.id, id));
    return guild;
  }

  async getGuildByName(name: string, realm: string): Promise<Guild | undefined> {
    const db = await getDb();
    const [guild] = await db
      .select()
      .from(guilds)
      .where(
        and(
          eq(guilds.name, name),
          eq(guilds.realm, realm)
        )
      );
    return guild;
  }

  async createGuild(guild: InsertGuild): Promise<Guild> {
    const db = await getDb();
    const [createdGuild] = await db
      .insert(guilds)
      .values(guild)
      .returning();
    return createdGuild;
  }

  async updateGuild(id: number, guildData: Partial<InsertGuild>): Promise<Guild | undefined> {
    const db = await getDb();
    const [updatedGuild] = await db
      .update(guilds)
      .set(guildData)
      .where(eq(guilds.id, id))
      .returning();
    return updatedGuild;
  }

  // Character operations
  async getCharacter(id: number): Promise<Character | undefined> {
    const db = await getDb();
    const [character] = await db
      .select()
      .from(characters)
      .where(eq(characters.id, id));
    return character;
  }

  async getCharactersByGuildId(guildId: number): Promise<Character[]> {
    const db = await getDb();
    return await db
      .select()
      .from(characters)
      .where(eq(characters.guildId, guildId));
  }
  
  /**
   * Count characters for a guild - more efficient than loading all characters
   * @param guildId The ID of the guild to count characters for
   * @returns The number of characters belonging to the guild
   */
  async countCharactersByGuildId(guildId: number): Promise<number> {
    const db = await getDb();
    const [result] = await db
      .select({ count: sql`count(*)` })
      .from(characters)
      .where(eq(characters.guildId, guildId));
    
    return Number(result.count) || 0;
  }

  async getCharacterByNameAndGuild(name: string, guildId: number): Promise<Character | undefined> {
    const db = await getDb();
    const [character] = await db
      .select()
      .from(characters)
      .where(
        and(
          eq(characters.name, name),
          eq(characters.guildId, guildId)
        )
      );
    return character;
  }

  async createCharacter(character: InsertCharacter): Promise<Character> {
    const db = await getDb();
    const [createdCharacter] = await db
      .insert(characters)
      .values(character)
      .returning();
    return createdCharacter;
  }

  async updateCharacter(id: number, characterData: Partial<InsertCharacter>): Promise<Character | undefined> {
    const db = await getDb();
    const [updatedCharacter] = await db
      .update(characters)
      .set(characterData)
      .where(eq(characters.id, id))
      .returning();
    return updatedCharacter;
  }

  async deleteCharacter(id: number): Promise<boolean> {
    const db = await getDb();
    const [deletedCharacter] = await db
      .delete(characters)
      .where(eq(characters.id, id))
      .returning();
    return !!deletedCharacter;
  }

  // Raid progress operations
  async getRaidProgress(id: number): Promise<RaidProgress | undefined> {
    const db = await getDb();
    const [progress] = await db
      .select()
      .from(raidProgress)
      .where(eq(raidProgress.id, id));
    return progress;
  }

  async getRaidProgressesByGuildId(guildId: number): Promise<RaidProgress[]> {
    const db = await getDb();
    
    // Use a more direct approach without computed columns in orderBy
    // First, get all raid progresses
    const progresses = await db
      .select()
      .from(raidProgress)
      .where(eq(raidProgress.guildId, guildId));
      
    // Then manually sort them
    return progresses.sort((a: RaidProgress, b: RaidProgress) => {
      // First by isCurrentTier (true comes before false)
      if (a.isCurrentTier && !b.isCurrentTier) return -1;
      if (!a.isCurrentTier && b.isCurrentTier) return 1;
      
      // Then by lastUpdated date (newest first)
      const dateA = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
      const dateB = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
      return dateB - dateA;
    });
  }

  async createRaidProgress(raidProgress: InsertRaidProgress): Promise<RaidProgress> {
    const db = await getDb();
    const [createdProgress] = await db
      .insert(raidProgress)
      .values(raidProgress)
      .returning();
    return createdProgress;
  }

  async updateRaidProgress(id: number, raidProgressData: Partial<InsertRaidProgress>): Promise<RaidProgress | undefined> {
    const db = await getDb();
    const [updatedProgress] = await db
      .update(raidProgress)
      .set(raidProgressData)
      .where(eq(raidProgress.id, id))
      .returning();
    return updatedProgress;
  }

  // Raid boss operations
  async getRaidBoss(id: number): Promise<RaidBoss | undefined> {
    const db = await getDb();
    const [boss] = await db
      .select()
      .from(raidBosses)
      .where(eq(raidBosses.id, id));
    return boss;
  }

  async getRaidBossesByGuildId(guildId: number, raidName?: string, difficulty?: string): Promise<RaidBoss[]> {
    const db = await getDb();
    
    // Build the query with the necessary conditions
    let query = db
      .select()
      .from(raidBosses)
      .where(eq(raidBosses.guildId, guildId));

    if (raidName) {
      query = query.where(eq(raidBosses.raidName, raidName));
    }

    if (difficulty) {
      query = query.where(eq(raidBosses.difficulty, difficulty));
    }

    // Get all raid bosses and then sort them in JavaScript to avoid circular reference
    const bosses = await query;
    
    // Sort by position
    return bosses.sort((a: RaidBoss, b: RaidBoss) => {
      const posA = a.position || 0;
      const posB = b.position || 0;
      return posA - posB;
    });
  }

  async createRaidBoss(raidBoss: InsertRaidBoss): Promise<RaidBoss> {
    const db = await getDb();
    
    if (isMySql()) {
      // MySQL implementation - doesn't support returning()
      try {
        console.log('DatabaseStorage: Using MySQL createRaidBoss implementation');
        // Insert first without returning
        await db
          .insert(raidBosses)
          .values(raidBoss);
        
        // Then fetch the newly created record
        const [newBoss] = await db
          .select()
          .from(raidBosses)
          .where(
            eq(raidBosses.name, raidBoss.name as string)
          )
          .orderBy(desc(raidBosses.id))
          .limit(1);
          
        if (!newBoss) {
          throw new Error('Failed to create raid boss: Could not find the newly created boss');
        }
        
        return newBoss;
      } catch (error) {
        console.error('Error in MySQL createRaidBoss:', error);
        throw error;
      }
    } else {
      // PostgreSQL implementation - supports returning()
      console.log('DatabaseStorage: Using PostgreSQL createRaidBoss implementation');
      const [createdBoss] = await db
        .insert(raidBosses)
        .values(raidBoss)
        .returning();
      return createdBoss;
    }
  }

  async updateRaidBoss(id: number, raidBossData: Partial<InsertRaidBoss>): Promise<RaidBoss | undefined> {
    const db = await getDb();
    
    if (isMySql()) {
      // MySQL implementation - doesn't support returning()
      try {
        console.log('DatabaseStorage: Using MySQL updateRaidBoss implementation');
        // Update the record
        await db
          .update(raidBosses)
          .set(raidBossData)
          .where(eq(raidBosses.id, id));
        
        // Then fetch the updated record
        const [updatedBoss] = await db
          .select()
          .from(raidBosses)
          .where(eq(raidBosses.id, id));
          
        return updatedBoss;
      } catch (error) {
        console.error('Error in MySQL updateRaidBoss:', error);
        throw error;
      }
    } else {
      // PostgreSQL implementation - supports returning()
      console.log('DatabaseStorage: Using PostgreSQL updateRaidBoss implementation');
      const [updatedBoss] = await db
        .update(raidBosses)
        .set(raidBossData)
        .where(eq(raidBosses.id, id))
        .returning();
      return updatedBoss;
    }
  }

  async deleteRaidBoss(id: number): Promise<boolean> {
    const db = await getDb();
    
    if (isMySql()) {
      // MySQL implementation - doesn't support returning()
      try {
        console.log('DatabaseStorage: Using MySQL deleteRaidBoss implementation');
        
        // Check if the boss exists before deleting
        const [existingBoss] = await db
          .select()
          .from(raidBosses)
          .where(eq(raidBosses.id, id));
          
        if (!existingBoss) {
          console.warn('Boss not found, ID:', id);
          return false;
        }
        
        // Delete the boss
        await db
          .delete(raidBosses)
          .where(eq(raidBosses.id, id));
          
        return true;
      } catch (error) {
        console.error('Error in MySQL deleteRaidBoss:', error);
        return false;
      }
    } else {
      // PostgreSQL implementation - supports returning()
      console.log('DatabaseStorage: Using PostgreSQL deleteRaidBoss implementation');
      const [deletedBoss] = await db
        .delete(raidBosses)
        .where(eq(raidBosses.id, id))
        .returning();
      return !!deletedBoss;
    }
  }

  // Admin user operations
  async getAdminUserById(id: number): Promise<AdminUser | undefined> {
    const db = await getDb();
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, id));
    return user;
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    const db = await getDb();
    
    // For PostgreSQL, use LOWER() for case-insensitive comparison
    const [user] = await db
      .select()
      .from(adminUsers)
      .where(sql`LOWER(${adminUsers.username}) = LOWER(${username})`);
    
    return user;
  }

  async createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser> {
    const db = await getDb();
    
    if (isMySql()) {
      // MySQL implementation - doesn't support returning()
      try {
        console.log('DatabaseStorage: Using MySQL createAdminUser implementation');
        // Insert first without returning
        const result = await db
          .insert(adminUsers)
          .values({
            ...adminUser,
            lastUpdated: new Date(),
            lastLogin: new Date()
          });
        
        // Then fetch the newly created record
        const [user] = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.username, adminUser.username as string));
          
        if (!user) {
          throw new Error('Failed to create admin user: Could not find the newly created user');
        }
        
        return user;
      } catch (error) {
        console.error('Error in MySQL createAdminUser:', error);
        throw error;
      }
    } else {
      // PostgreSQL implementation
      const [user] = await db
        .insert(adminUsers)
        .values({
          ...adminUser,
          lastUpdated: new Date(),
          lastLogin: new Date()
        })
        .returning();
      return user;
    }
  }

  async updateAdminUser(id: number, adminUserData: Partial<InsertAdminUser>): Promise<AdminUser | undefined> {
    const db = await getDb();
    const adminData = {
      ...adminUserData,
      lastUpdated: new Date()
    };
    
    if (isMySql()) {
      // MySQL implementation - doesn't support returning()
      try {
        console.log('DatabaseStorage: Using MySQL updateAdminUser implementation');
        // Update first
        await db
          .update(adminUsers)
          .set(adminData)
          .where(eq(adminUsers.id, id));
        
        // Then retrieve the updated user
        const [updatedUser] = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.id, id));
          
        return updatedUser;
      } catch (error) {
        console.error('Error in MySQL updateAdminUser:', error);
        throw error;
      }
    } else {
      // PostgreSQL implementation
      const [user] = await db
        .update(adminUsers)
        .set(adminData)
        .where(eq(adminUsers.id, id))
        .returning();
      return user;
    }
  }

  async verifyAdminCredentials(username: string, password: string): Promise<AdminUser | undefined> {
    // Use case-insensitive username lookup
    const user = await this.getAdminUserByUsername(username);

    if (!user) {
      return undefined;
    }

    try {
      // Split the stored password into hash and salt
      const [hashedPassword, salt] = user.password.split('.');
      
      if (!hashedPassword || !salt) {
        console.log('Invalid hash format, missing hash or salt');
        return undefined;
      }
      
      // Hash the provided password with the same salt
      const hashedPasswordBuf = Buffer.from(hashedPassword, 'hex');
      const suppliedPasswordBuf = (await scryptAsync(password, salt, 64)) as Buffer;
      
      // Compare the hashes using timing-safe comparison
      const match = timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
      
      return match ? user : undefined;
    } catch (error) {
      console.error('Error verifying admin credentials:', error);
      return undefined;
    }
  }

  async getAllAdminUsers(countOnly: boolean = false): Promise<AdminUser[]> {
    const db = await getDb();
    
    // If we only need the count, we can optimize this query
    if (countOnly) {
      const result = await db
        .select({ count: sql`count(*)` })
        .from(adminUsers);
      
      const count = Number(result[0]?.count || 0);
      
      // Return an array with that many elements to match the expected interface
      return Array(count).fill({}) as AdminUser[];
    }
    
    // Otherwise, return all admin users sorted by username
    return await db
      .select()
      .from(adminUsers)
      .orderBy(asc(adminUsers.username));
  }

  async deleteAdminUser(id: number): Promise<boolean> {
    const db = await getDb();
    try {
      if (isMySql()) {
        // MySQL implementation - doesn't support returning()
        console.log('DatabaseStorage: Using MySQL deleteAdminUser implementation');
        
        // Check if the user exists before deleting
        const [existingUser] = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.id, id));
          
        if (!existingUser) {
          console.warn('Admin user not found, ID:', id);
          return false;
        }
        
        // Delete the user
        await db
          .delete(adminUsers)
          .where(eq(adminUsers.id, id));
          
        return true;
      } else {
        // PostgreSQL implementation
        const [deletedUser] = await db
          .delete(adminUsers)
          .where(eq(adminUsers.id, id))
          .returning();
        return !!deletedUser;
      }
    } catch (error) {
      console.error('Error deleting admin user:', error);
      return false;
    }
  }

  // Application operations
  async getApplication(id: number): Promise<Application | undefined> {
    const db = await getDb();
    const [application] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id));
    return application;
  }

  async getApplications(status?: string): Promise<Application[]> {
    const db = await getDb();
    
    let query = db
      .select()
      .from(applications);

    if (status) {
      query = query.where(eq(applications.status, status));
    }

    // First get all applications, then sort them
    const allApplications = await query;
    
    // Sort by submittedAt in descending order (newest first)
    return allApplications.sort((a: Application, b: Application) => {
      const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const db = await getDb();
    const [createdApplication] = await db
      .insert(applications)
      .values({
        ...application,
        submittedAt: new Date(),
        lastUpdated: new Date()
      })
      .returning();
    return createdApplication;
  }

  async updateApplication(id: number, applicationData: Partial<InsertApplication>): Promise<Application | undefined> {
    const db = await getDb();
    const data = {
      ...applicationData,
      lastUpdated: new Date()
    };
    const [updatedApplication] = await db
      .update(applications)
      .set(data)
      .where(eq(applications.id, id))
      .returning();
    return updatedApplication;
  }

  async changeApplicationStatus(id: number, status: string, reviewedBy: number, reviewNotes?: string): Promise<Application | undefined> {
    const db = await getDb();
    const [updatedApplication] = await db
      .update(applications)
      .set({
        status,
        reviewedBy,
        reviewNotes,
        reviewedAt: new Date(),
        lastUpdated: new Date()
      })
      .where(eq(applications.id, id))
      .returning();
    return updatedApplication;
  }

  // Application comment operations
  async getApplicationComments(applicationId: number): Promise<(ApplicationComment & { adminUsername?: string })[]> {
    const db = await getDb();
    
    // First get all comments for this application
    const comments = await db
      .select({
        ...applicationComments,
        adminUsername: adminUsers.username,
      })
      .from(applicationComments)
      .leftJoin(adminUsers, eq(applicationComments.adminId, adminUsers.id))
      .where(eq(applicationComments.applicationId, applicationId));
      
    // Then sort them by createdAt in ascending order (oldest first)
    return comments.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });
  }

  async createApplicationComment(comment: InsertApplicationComment): Promise<ApplicationComment> {
    const db = await getDb();
    const [createdComment] = await db
      .insert(applicationComments)
      .values({
        ...comment,
        createdAt: new Date()
      })
      .returning();
    return createdComment;
  }

  // Application notification operations
  async getAdminNotifications(adminId: number): Promise<ApplicationNotification[]> {
    const db = await getDb();
    
    // First get all notifications for this admin
    const notifications = await db
      .select()
      .from(applicationNotifications)
      .where(eq(applicationNotifications.adminId, adminId));
      
    // Then sort them by createdAt in descending order (newest first)
    return notifications.sort((a: ApplicationNotification, b: ApplicationNotification) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  async createApplicationNotification(notification: InsertApplicationNotification): Promise<ApplicationNotification> {
    const db = await getDb();
    const [createdNotification] = await db
      .insert(applicationNotifications)
      .values({
        ...notification,
        createdAt: new Date(),
        isRead: false
      })
      .returning();
    return createdNotification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const db = await getDb();
    try {
      const [updatedNotification] = await db
        .update(applicationNotifications)
        .set({ isRead: true })
        .where(eq(applicationNotifications.id, id))
        .returning();
      return !!updatedNotification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  //============================================
  // Website Content Management Methods
  //============================================

  // Website Content 
  async getWebsiteContentByKey(key: string): Promise<any> {
    const db = await getDb();
    const [content] = await db
      .select()
      .from(sql`website_content`)
      .where(sql`key = ${key}`);
    return content;
  }

  async getAllWebsiteContent(): Promise<any[]> {
    const db = await getDb();
    const content = await db
      .select()
      .from(sql`website_content`)
      .orderBy(sql`last_updated DESC`);
    return content;
  }

  async createWebsiteContent(content: any): Promise<any> {
    const db = await getDb();
    const [createdContent] = await db
      .insert(sql`website_content`)
      .values({
        ...content,
        last_updated: new Date()
      })
      .returning();
    return createdContent;
  }

  async updateWebsiteContent(key: string, content: any): Promise<any> {
    const db = await getDb();
    const [updatedContent] = await db
      .update(sql`website_content`)
      .set({
        ...content,
        last_updated: new Date()
      })
      .where(sql`key = ${key}`)
      .returning();
    return updatedContent;
  }

  async deleteWebsiteContent(key: string): Promise<boolean> {
    const db = await getDb();
    const [deletedContent] = await db
      .delete(sql`website_content`)
      .where(sql`key = ${key}`)
      .returning();
    return !!deletedContent;
  }

  // Website Settings
  async getWebsiteSetting(key: string): Promise<any> {
    const db = await getDb();
    const [setting] = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.key, key));
    return setting;
  }

  async getAllWebsiteSettings(): Promise<any[]> {
    const db = await getDb();
    const settings = await db
      .select()
      .from(websiteSettings)
      .orderBy(websiteSettings.category);
    return settings;
  }

  async getWebsiteSettingsByCategory(category: string): Promise<any[]> {
    const db = await getDb();
    const settings = await db
      .select()
      .from(websiteSettings)
      .where(eq(websiteSettings.category, category))
      .orderBy(websiteSettings.key);
    return settings;
  }

  async updateWebsiteSetting(key: string, value: string, updatedBy?: number): Promise<any> {
    try {
      const db = await getDb();
      
      // First check if the setting exists
      const existingSetting = await this.getWebsiteSetting(key);
      
      if (!existingSetting) {
        // If setting doesn't exist, create it with default values
        const [newSetting] = await db
          .insert(websiteSettings)
          .values({
            key,
            value,
            type: 'string',
            category: 'general',
            description: 'Auto-created setting',
            updatedBy
          })
          .returning();
        return newSetting;
      }
      
      // If setting exists, update it
      const [updatedSetting] = await db
        .update(websiteSettings)
        .set({
          value,
          updatedBy,
          lastUpdated: new Date()
        })
        .where(eq(websiteSettings.key, key))
        .returning();
      
      return updatedSetting;
    } catch (error) {
      console.error("Error in updateWebsiteSetting:", error);
      throw error;
    }
  }

  // Translations
  async getTranslation(key: string): Promise<any> {
    const db = await getDb();
    const [translation] = await db
      .select()
      .from(sql`translations`)
      .where(sql`key = ${key}`);
    return translation;
  }

  async getAllTranslations(): Promise<any[]> {
    const db = await getDb();
    const translations = await db
      .select()
      .from(sql`translations`)
      .orderBy(sql`key`);
    return translations;
  }

  async updateTranslation(key: string, enText: string, noText?: string): Promise<any> {
    const db = await getDb();
    const [updatedTranslation] = await db
      .update(sql`translations`)
      .set({
        en_text: enText,
        no_text: noText,
        last_updated: new Date()
      })
      .where(sql`key = ${key}`)
      .returning();
    return updatedTranslation;
  }

  async createTranslation(translation: any): Promise<any> {
    const db = await getDb();
    const [createdTranslation] = await db
      .insert(sql`translations`)
      .values({
        ...translation,
        last_updated: new Date()
      })
      .returning();
    return createdTranslation;
  }

  // Media Files
  async getMediaFile(id: number): Promise<any> {
    const db = await getDb();
    const [file] = await db
      .select()
      .from(sql`media_files`)
      .where(sql`id = ${id}`);
    return file;
  }

  async getAllMediaFiles(): Promise<any[]> {
    const db = await getDb();
    const files = await db
      .select()
      .from(sql`media_files`)
      .orderBy(sql`uploaded_at DESC`);
    return files;
  }

  async createMediaFile(fileData: any): Promise<any> {
    const db = await getDb();
    const [createdFile] = await db
      .insert(sql`media_files`)
      .values({
        ...fileData,
        uploaded_at: new Date()
      })
      .returning();
    return createdFile;
  }

  async deleteMediaFile(id: number): Promise<boolean> {
    const db = await getDb();
    const [deletedFile] = await db
      .delete(sql`media_files`)
      .where(sql`id = ${id}`)
      .returning();
    return !!deletedFile;
  }

  // Web log operations
  async getWebLogs(
    limit: number = 100, 
    offset: number = 0, 
    dateStart?: Date, 
    dateEnd?: Date
  ): Promise<WebLog[]> {
    const db = await getDb();
    let query = db
      .select()
      .from(webLogs)
      .orderBy(desc(webLogs.timestamp));
    
    // Apply date filters if provided
    if (dateStart) {
      query = query.where(gte(webLogs.timestamp, dateStart));
    }
    if (dateEnd) {
      query = query.where(lte(webLogs.timestamp, dateEnd));
    }
    
    return await query.limit(limit).offset(offset);
  }

  /**
   * Count total number of logs with optional date filters
   */
  async countWebLogs(dateStart?: Date, dateEnd?: Date): Promise<number> {
    const db = await getDb();
    let query = db
      .select({ count: count() })
      .from(webLogs);
    
    // Apply date filters if provided
    if (dateStart) {
      query = query.where(gte(webLogs.timestamp, dateStart));
    }
    if (dateEnd) {
      query = query.where(lte(webLogs.timestamp, dateEnd));
    }
    
    const result = await query;
    return result[0]?.count || 0;
  }

  async getWebLogsByOperation(
    operation: string, 
    limit: number = 100, 
    offset: number = 0,
    dateStart?: Date,
    dateEnd?: Date
  ): Promise<WebLog[]> {
    const db = await getDb();
    let query = db
      .select()
      .from(webLogs)
      .where(eq(webLogs.operation, operation));
    
    // Apply date filters if provided
    if (dateStart) {
      query = query.where(gte(webLogs.timestamp, dateStart));
    }
    if (dateEnd) {
      query = query.where(lte(webLogs.timestamp, dateEnd));
    }
    
    return await query.orderBy(desc(webLogs.timestamp)).limit(limit).offset(offset);
  }

  /**
   * Count logs by operation with optional date filters
   */
  async countWebLogsByOperation(
    operation: string,
    dateStart?: Date,
    dateEnd?: Date
  ): Promise<number> {
    const db = await getDb();
    let query = db
      .select({ count: count() })
      .from(webLogs)
      .where(eq(webLogs.operation, operation));
    
    // Apply date filters if provided
    if (dateStart) {
      query = query.where(gte(webLogs.timestamp, dateStart));
    }
    if (dateEnd) {
      query = query.where(lte(webLogs.timestamp, dateEnd));
    }
    
    const result = await query;
    return result[0]?.count || 0;
  }

  async getWebLogsByStatus(
    status: string, 
    limit: number = 100, 
    offset: number = 0,
    dateStart?: Date,
    dateEnd?: Date
  ): Promise<WebLog[]> {
    const db = await getDb();
    let query = db
      .select()
      .from(webLogs)
      .where(eq(webLogs.status, status));
    
    // Apply date filters if provided
    if (dateStart) {
      query = query.where(gte(webLogs.timestamp, dateStart));
    }
    if (dateEnd) {
      query = query.where(lte(webLogs.timestamp, dateEnd));
    }
    
    return await query.orderBy(desc(webLogs.timestamp)).limit(limit).offset(offset);
  }

  /**
   * Count logs by status with optional date filters
   */
  async countWebLogsByStatus(
    status: string,
    dateStart?: Date,
    dateEnd?: Date
  ): Promise<number> {
    const db = await getDb();
    let query = db
      .select({ count: count() })
      .from(webLogs)
      .where(eq(webLogs.status, status));
    
    // Apply date filters if provided
    if (dateStart) {
      query = query.where(gte(webLogs.timestamp, dateStart));
    }
    if (dateEnd) {
      query = query.where(lte(webLogs.timestamp, dateEnd));
    }
    
    const result = await query;
    return result[0]?.count || 0;
  }

  async getWebLogsByUser(
    userId: number, 
    limit: number = 100, 
    offset: number = 0,
    dateStart?: Date,
    dateEnd?: Date
  ): Promise<WebLog[]> {
    const db = await getDb();
    let query = db
      .select()
      .from(webLogs)
      .where(eq(webLogs.userId, userId));
    
    // Apply date filters if provided
    if (dateStart) {
      query = query.where(gte(webLogs.timestamp, dateStart));
    }
    if (dateEnd) {
      query = query.where(lte(webLogs.timestamp, dateEnd));
    }
    
    return await query.orderBy(desc(webLogs.timestamp)).limit(limit).offset(offset);
  }

  /**
   * Count logs by user with optional date filters
   */
  async countWebLogsByUser(
    userId: number,
    dateStart?: Date,
    dateEnd?: Date
  ): Promise<number> {
    const db = await getDb();
    let query = db
      .select({ count: count() })
      .from(webLogs)
      .where(eq(webLogs.userId, userId));
    
    // Apply date filters if provided
    if (dateStart) {
      query = query.where(gte(webLogs.timestamp, dateStart));
    }
    if (dateEnd) {
      query = query.where(lte(webLogs.timestamp, dateEnd));
    }
    
    const result = await query;
    return result[0]?.count || 0;
  }

  async createWebLog(webLog: InsertWebLog): Promise<WebLog> {
    const db = await getDb();
    
    // Make sure timestamp is a proper Date object
    const logEntry = {
      ...webLog,
      timestamp: webLog.timestamp || new Date(),
    };
    
    if (isMySql()) {
      // MySQL implementation - doesn't support returning()
      try {
        console.log('DatabaseStorage: Using MySQL createWebLog implementation');
        // Insert without returning
        const result = await db
          .insert(webLogs)
          .values(logEntry);
        
        // Get the ID of the inserted record from the result
        const insertId = result[0].insertId;
        
        // Then fetch the newly created record by ID
        const [newLog] = await db
          .select()
          .from(webLogs)
          .where(eq(webLogs.id, insertId));
          
        if (!newLog) {
          throw new Error('Failed to create web log: Could not find the newly created log');
        }
        
        return newLog;
      } catch (error) {
        console.error('Error in MySQL createWebLog:', error);
        throw error;
      }
    } else {
      // PostgreSQL implementation - supports returning()
      console.log('DatabaseStorage: Using PostgreSQL createWebLog implementation');
      const [createdLog] = await db
        .insert(webLogs)
        .values(logEntry)
        .returning();
      return createdLog;
    }
  }

  async deleteWebLogs(olderThanDays: number): Promise<number> {
    const db = await getDb();
    
    // Calculate the date threshold
    const date = new Date();
    date.setDate(date.getDate() - olderThanDays);
    
    try {
      // Delete logs older than the specified days
      const result = await db
        .delete(webLogs)
        .where(lt(webLogs.timestamp, date));
      
      // For MySQL, result is an object with affectedRows property
      // For PostgreSQL, it's the number of affected rows
      if (typeof result === 'object' && 'affectedRows' in result) {
        return result.affectedRows as number;
      }
      
      // Return 0 if we can't determine the count
      return 0;
    } catch (error) {
      console.error(`Error deleting web logs older than ${olderThanDays} days:`, error);
      return 0;
    }
  }

  // User Authentication Methods

  /**
   * Get a user by their Battle.net ID
   * @param battleNetId The Battle.net ID to look up
   * @returns The user if found, undefined otherwise
   */
  async getUserByBattleNetId(battleNetId: string): Promise<User | undefined> {
    try {
      const db = await getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.battleNetId, battleNetId));
      return user;
    } catch (error) {
      console.error('Error getting user by Battle.net ID:', error);
      return undefined;
    }
  }

  /**
   * Create a new user from Battle.net authentication
   * @param userData The user data to insert
   * @returns The created user
   */
  async createUser(userData: InsertUser): Promise<User> {
    try {
      const db = await getDb();
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update a user's information
   * @param id The user ID
   * @param userData The updated user data
   * @returns The updated user if found, undefined otherwise
   */
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const db = await getDb();
      const [user] = await db
        .update(users)
        .set({
          ...userData,
          lastLogin: new Date()
        })
        .where(eq(users.id, id))
        .returning();
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  /**
   * Update a user's access token and related fields
   * @param id The user ID
   * @param accessToken The new access token
   * @param refreshToken The new refresh token
   * @param tokenExpiry The new token expiry timestamp
   * @returns The updated user if found, undefined otherwise
   */
  async updateUserTokens(id: number, accessToken: string, refreshToken: string, tokenExpiry: Date): Promise<User | undefined> {
    return this.updateUser(id, {
      accessToken,
      refreshToken,
      tokenExpiry
    });
  }

  /**
   * Get characters owned by a user
   * @param userId The user ID
   * @returns Array of characters with ownership information
   */
  async getUserCharacters(userId: number): Promise<(Character & { isMain: boolean, verified: boolean })[]> {
    try {
      const db = await getDb();
      const result = await db
        .select({
          ...characters,
          isMain: userCharacters.isMain,
          verified: userCharacters.verified
        })
        .from(userCharacters)
        .innerJoin(characters, eq(userCharacters.characterId, characters.id))
        .where(eq(userCharacters.userId, userId));
      
      return result;
    } catch (error) {
      console.error('Error getting user characters:', error);
      return [];
    }
  }

  /**
   * Link a character to a user account
   * @param linkData The user-character relationship data
   * @returns The created relationship
   */
  async linkCharacterToUser(linkData: InsertUserCharacter): Promise<UserCharacter> {
    try {
      const db = await getDb();
      const [link] = await db
        .insert(userCharacters)
        .values(linkData)
        .returning();
      return link;
    } catch (error) {
      console.error('Error linking character to user:', error);
      throw error;
    }
  }

  /**
   * Verify ownership of a character for a user
   * @param userId The user ID
   * @param characterId The character ID
   * @returns True if the verification was successful
   */
  async verifyCharacterOwnership(userId: number, characterId: number): Promise<boolean> {
    try {
      const db = await getDb();
      const result = await db
        .update(userCharacters)
        .set({
          verified: true,
          verifiedAt: new Date()
        })
        .where(and(
          eq(userCharacters.userId, userId),
          eq(userCharacters.characterId, characterId)
        ));
      
      return !!result.rowCount;
    } catch (error) {
      console.error('Error verifying character ownership:', error);
      return false;
    }
  }

  /**
   * Set a character as the user's main character
   * @param userId The user ID
   * @param characterId The character ID
   * @returns True if successful
   */
  async setMainCharacter(userId: number, characterId: number): Promise<boolean> {
    try {
      const db = await getDb();
      // First, set all characters to not be main
      await db
        .update(userCharacters)
        .set({ isMain: false })
        .where(eq(userCharacters.userId, userId));
      
      // Then set the selected character as main
      const result = await db
        .update(userCharacters)
        .set({ isMain: true })
        .where(and(
          eq(userCharacters.userId, userId),
          eq(userCharacters.characterId, characterId)
        ));
      
      return !!result.rowCount;
    } catch (error) {
      console.error('Error setting main character:', error);
      return false;
    }
  }

  /**
   * Check if a user owns a specific character
   * @param userId The user ID
   * @param characterId The character ID
   * @returns True if the user owns the character
   */
  async userOwnsCharacter(userId: number, characterId: number): Promise<boolean> {
    try {
      const db = await getDb();
      const [result] = await db
        .select()
        .from(userCharacters)
        .where(and(
          eq(userCharacters.userId, userId),
          eq(userCharacters.characterId, characterId)
        ));
      
      return !!result;
    } catch (error) {
      console.error('Error checking character ownership:', error);
      return false;
    }
  }

  /**
   * Get a user's main character
   * @param userId The user ID
   * @returns The main character if found, undefined otherwise
   */
  async getUserMainCharacter(userId: number): Promise<(Character & { isMain: boolean, verified: boolean }) | undefined> {
    try {
      const db = await getDb();
      const [result] = await db
        .select({
          ...characters,
          isMain: userCharacters.isMain,
          verified: userCharacters.verified
        })
        .from(userCharacters)
        .innerJoin(characters, eq(userCharacters.characterId, characters.id))
        .where(and(
          eq(userCharacters.userId, userId),
          eq(userCharacters.isMain, true)
        ));
      
      return result;
    } catch (error) {
      console.error('Error getting user main character:', error);
      return undefined;
    }
  }

  /**
   * Verifies if a user is a guild member by checking if any of their 
   * characters match with characters in our guild roster database
   * 
   * @param userId The user ID to check
   * @returns True if the user is a guild member, false otherwise
   */
  async verifyGuildMembership(userId: number): Promise<boolean> {
    try {
      console.log(`Verifying guild membership for user ID: ${userId}`);
      
      // First, get all the user's characters
      const userChars = await this.getUserCharacters(userId);
      if (!userChars || userChars.length === 0) {
        console.log(`No characters found for user ID: ${userId}`);
        await this.updateUser(userId, { isGuildMember: false });
        return false;
      }
      
      // Get the guild ID - assuming there's only one guild in the system
      const db = await getDb();
      const [guild] = await db.select().from(guilds).limit(1);
      
      if (!guild) {
        console.log('No guild found in the system');
        return false;
      }
      
      // More efficient approach: check if any of the user's characters exist in our guild roster
      let isGuildMember = false;
      
      // Extract character names and realms from user's characters
      for (const char of userChars) {
        // Direct database check if this character exists in the guild roster
        const [guildCharacter] = await db
          .select()
          .from(characters)
          .where(and(
            eq(characters.name, char.name),
            eq(characters.realm, char.realm),
            eq(characters.guildId, guild.id)
          ))
          .limit(1);
        
        if (guildCharacter) {
          console.log(`Character ${char.name}-${char.realm} found in guild roster`);
          isGuildMember = true;
          break;
        }
      }
      
      // Update user's guild membership status
      await this.updateUser(userId, { isGuildMember });
      
      console.log(`User ${userId} guild membership verification result: ${isGuildMember}`);
      return isGuildMember;
    } catch (error) {
      console.error('Error verifying guild membership:', error);
      return false;
    }
  }
}