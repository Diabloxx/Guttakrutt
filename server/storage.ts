import {
  Guild, InsertGuild, Character, InsertCharacter, RaidProgress, InsertRaidProgress,
  RaidBoss, InsertRaidBoss, AdminUser, InsertAdminUser, Application, InsertApplication,
  ApplicationComment, InsertApplicationComment, ApplicationNotification, InsertApplicationNotification,
  WebLog, InsertWebLog, User, InsertUser, UserCharacter, InsertUserCharacter,
  Expansion, InsertExpansion, RaidTier, InsertRaidTier
} from '@shared/schema';
import { DatabaseStorage } from './DatabaseStorage';
import session from "express-session";
import connectPg from "connect-pg-simple";
import memorystore from "memorystore";
import { pool } from './db';
import { databaseType } from './db-config';

// Set up session store
const MemoryStore = memorystore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Guild operations
  getGuild(id: number): Promise<Guild | undefined>;
  getGuildByName(name: string, realm: string): Promise<Guild | undefined>;
  createGuild(guild: InsertGuild): Promise<Guild>;
  updateGuild(id: number, guildData: Partial<InsertGuild>): Promise<Guild | undefined>;

  // Character operations
  getCharacter(id: number): Promise<Character | undefined>;
  getCharactersByGuildId(guildId: number): Promise<Character[]>;
  countCharactersByGuildId(guildId: number): Promise<number>;
  getCharacterByNameAndGuild(name: string, guildId: number): Promise<Character | undefined>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: number, characterData: Partial<InsertCharacter>): Promise<Character | undefined>;
  deleteCharacter(id: number): Promise<boolean>;

  // Expansion operations
  getExpansion(id: number): Promise<Expansion | undefined>;
  getExpansions(): Promise<Expansion[]>;
  getActiveExpansion(): Promise<Expansion | undefined>;
  createExpansion(expansion: InsertExpansion): Promise<Expansion>;
  updateExpansion(id: number, expansionData: Partial<InsertExpansion>): Promise<Expansion | undefined>;
  deleteExpansion(id: number): Promise<boolean>;
  setActiveExpansion(id: number): Promise<boolean>;

  // Raid tier operations
  getRaidTier(id: number): Promise<RaidTier | undefined>;
  getRaidTiersByExpansionId(expansionId: number): Promise<RaidTier[]>;
  getCurrentRaidTier(): Promise<RaidTier | undefined>;
  createRaidTier(raidTier: InsertRaidTier): Promise<RaidTier>;
  updateRaidTier(id: number, raidTierData: Partial<InsertRaidTier>): Promise<RaidTier | undefined>;
  deleteRaidTier(id: number): Promise<boolean>;
  setCurrentRaidTier(id: number): Promise<boolean>;
  
  // Raid progress operations
  getRaidProgress(id: number): Promise<RaidProgress | undefined>;
  getRaidProgressesByGuildId(guildId: number): Promise<RaidProgress[]>;
  getRaidProgressesByTierId(tierId: number): Promise<RaidProgress[]>;
  createRaidProgress(raidProgress: InsertRaidProgress): Promise<RaidProgress>;
  updateRaidProgress(id: number, raidProgressData: Partial<InsertRaidProgress>): Promise<RaidProgress | undefined>;

  // Raid boss operations
  getRaidBoss(id: number): Promise<RaidBoss | undefined>;
  getRaidBossesByGuildId(guildId: number, raidName?: string, difficulty?: string): Promise<RaidBoss[]>;
  getRaidBossesByTierId(tierId: number, difficulty?: string): Promise<RaidBoss[]>;
  createRaidBoss(raidBoss: InsertRaidBoss): Promise<RaidBoss>;
  updateRaidBoss(id: number, raidBossData: Partial<InsertRaidBoss>): Promise<RaidBoss | undefined>;
  deleteRaidBoss(id: number): Promise<boolean>;

  // Admin user operations
  getAdminUserById(id: number): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  createAdminUser(adminUser: InsertAdminUser): Promise<AdminUser>;
  updateAdminUser(id: number, adminUserData: Partial<InsertAdminUser>): Promise<AdminUser | undefined>;
  verifyAdminCredentials(username: string, password: string): Promise<AdminUser | undefined>;
  getAllAdminUsers(countOnly?: boolean): Promise<AdminUser[]>;
  deleteAdminUser(id: number): Promise<boolean>;

  // Application operations
  getApplication(id: number): Promise<Application | undefined>;
  getApplications(status?: string): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: number, applicationData: Partial<InsertApplication>): Promise<Application | undefined>;
  changeApplicationStatus(id: number, status: string, reviewedBy: number, reviewNotes?: string): Promise<Application | undefined>;

  // Application comment operations
  getApplicationComments(applicationId: number): Promise<ApplicationComment[]>;
  createApplicationComment(comment: InsertApplicationComment): Promise<ApplicationComment>;

  // Application notification operations
  getAdminNotifications(adminId: number): Promise<ApplicationNotification[]>;
  createApplicationNotification(notification: InsertApplicationNotification): Promise<ApplicationNotification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  
  // Web logs operations
  getWebLogs(limit?: number, offset?: number, dateStart?: Date, dateEnd?: Date): Promise<WebLog[]>;
  getWebLogsByOperation(operation: string, limit?: number, offset?: number, dateStart?: Date, dateEnd?: Date): Promise<WebLog[]>;
  getWebLogsByStatus(status: string, limit?: number, offset?: number, dateStart?: Date, dateEnd?: Date): Promise<WebLog[]>;
  getWebLogsByUser(userId: number, limit?: number, offset?: number, dateStart?: Date, dateEnd?: Date): Promise<WebLog[]>;
  countWebLogs(dateStart?: Date, dateEnd?: Date): Promise<number>;
  countWebLogsByOperation(operation: string, dateStart?: Date, dateEnd?: Date): Promise<number>;
  countWebLogsByStatus(status: string, dateStart?: Date, dateEnd?: Date): Promise<number>;
  countWebLogsByUser(userId: number, dateStart?: Date, dateEnd?: Date): Promise<number>;
  createWebLog(webLog: InsertWebLog): Promise<WebLog>;
  deleteWebLogs(olderThanDays: number): Promise<number>;

  // User operations for authentication
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByBattleNetId(battleNetId: string): Promise<User | undefined>;
  getUserByBattleTag(battleTag: string): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  updateUserTokens(id: number, accessToken: string, refreshToken: string, tokenExpiry: Date): Promise<User | undefined>;
  updateUserLastLogin(id: number): Promise<User | undefined>;
  connectBattleNetAccount(userId: number, battleNetId: string, battleTag: string, accessToken: string, refreshToken: string, tokenExpiry: Date): Promise<User | undefined>;
  updateUserBattleNetData(userId: number, data: { battleTag?: string; [key: string]: any }): Promise<User | undefined>;
  verifyGuildMembership(userId: number): Promise<boolean>;
  
  // User-Character relationship operations
  getUserCharacters(userId: number): Promise<(Character & { isMain: boolean, verified: boolean })[]>;
  linkCharacterToUser(linkData: InsertUserCharacter): Promise<UserCharacter>;
  verifyCharacterOwnership(userId: number, characterId: number): Promise<boolean>;
  setMainCharacter(userId: number, characterId: number): Promise<boolean>;
  userOwnsCharacter(userId: number, characterId: number): Promise<boolean>;
  getUserMainCharacter(userId: number): Promise<(Character & { isMain: boolean, verified: boolean }) | undefined>;

  // Shared session store for authentication
  sessionStore: session.Store;
}

class StorageWithSession extends DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    super();
    
    // Set up the appropriate session store based on the database type
    if (databaseType === 'mysql') {
      console.log('Using memory session store for MySQL');
      // When using MySQL, we fall back to memory store for sessions
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      });
    } else {
      console.log('Using PostgreSQL session store');
      // When using PostgreSQL, we use connect-pg-simple for sessions
      this.sessionStore = new PostgresSessionStore({
        pool: pool as any, // Type assertion to avoid Pool compatibility issues
        tableName: 'session',
        createTableIfMissing: true
      });
    }
  }

  // Explicitly implementing IStorage interface methods for Battle.net auth
  async getUser(id: number): Promise<User | undefined> {
    return super.getUser(id);
  }
  
  async getUserByBattleNetId(battleNetId: string): Promise<User | undefined> {
    return super.getUserByBattleNetId(battleNetId);
  }
  
  async getUserByBattleTag(battleTag: string): Promise<User | undefined> {
    return super.getUserByBattleTag(battleTag);
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    return super.createUser(userData);
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    return super.updateUser(id, userData);
  }
  
  async updateUserTokens(id: number, accessToken: string, refreshToken: string, tokenExpiry: Date): Promise<User | undefined> {
    return super.updateUserTokens(id, accessToken, refreshToken, tokenExpiry);
  }
  
  async updateUserBattleNetData(userId: number, data: { battleTag?: string; [key: string]: any }): Promise<User | undefined> {
    return super.updateUserBattleNetData(userId, data);
  }
  
  async getUserCharacters(userId: number): Promise<(Character & { isMain: boolean, verified: boolean })[]> {
    return super.getUserCharacters(userId);
  }
  
  async linkCharacterToUser(linkData: InsertUserCharacter): Promise<UserCharacter> {
    return super.linkCharacterToUser(linkData);
  }
  
  async verifyCharacterOwnership(userId: number, characterId: number): Promise<boolean> {
    return super.verifyCharacterOwnership(userId, characterId);
  }
  
  async setMainCharacter(userId: number, characterId: number): Promise<boolean> {
    return super.setMainCharacter(userId, characterId);
  }
  
  async userOwnsCharacter(userId: number, characterId: number): Promise<boolean> {
    return super.userOwnsCharacter(userId, characterId);
  }
  
  async getUserMainCharacter(userId: number): Promise<(Character & { isMain: boolean, verified: boolean }) | undefined> {
    return super.getUserMainCharacter(userId);
  }
  
  async verifyGuildMembership(userId: number): Promise<boolean> {
    return super.verifyGuildMembership(userId);
  }
}

// Import MySQL-specific implementation for MySQL mode
import { MySqlDatabaseStorage } from './DatabaseStorage.mysql';

// Create storage implementation based on database type
let storageImplementation: StorageWithSession;

// Use database-specific implementation based on configuration
if (databaseType === 'mysql') {
  console.log('Using MySQL-specific database storage implementation');
  
  // Create MySQL-specific implementation that handles schema differences
  class MySqlStorageWithSession extends MySqlDatabaseStorage implements IStorage {
    sessionStore: session.Store;
    
    constructor() {
      super();
      console.log('Using memory session store for MySQL');
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      });
    }
    
    // Explicitly implementing IStorage interface methods for authentication
    async getUser(id: number): Promise<User | undefined> {
      return super.getUser(id);
    }
    
    async getUserByUsername(username: string): Promise<User | undefined> {
      return super.getUserByUsername(username);
    }
    
    async getUserByEmail(email: string): Promise<User | undefined> {
      return super.getUserByEmail(email);
    }
    
    async getUserByBattleNetId(battleNetId: string): Promise<User | undefined> {
      return super.getUserByBattleNetId(battleNetId);
    }
    
    async getUserByBattleTag(battleTag: string): Promise<User | undefined> {
      return super.getUserByBattleTag(battleTag);
    }
    
    async createUser(userData: InsertUser): Promise<User> {
      return super.createUser(userData);
    }
    
    async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
      return super.updateUser(id, userData);
    }
    
    async updateUserTokens(id: number, accessToken: string, refreshToken: string, tokenExpiry: Date): Promise<User | undefined> {
      return super.updateUserTokens(id, accessToken, refreshToken, tokenExpiry);
    }
    
    async updateUserLastLogin(id: number): Promise<User | undefined> {
      return super.updateUserLastLogin(id);
    }
    
    async connectBattleNetAccount(userId: number, battleNetId: string, battleTag: string, accessToken: string, refreshToken: string, tokenExpiry: Date): Promise<User | undefined> {
      return super.connectBattleNetAccount(userId, battleNetId, battleTag, accessToken, refreshToken, tokenExpiry);
    }
    
    async updateUserBattleNetData(userId: number, data: { battleTag?: string; [key: string]: any }): Promise<User | undefined> {
      return super.updateUserBattleNetData(userId, data);
    }
    
    async getUserCharacters(userId: number): Promise<(Character & { isMain: boolean, verified: boolean })[]> {
      return super.getUserCharacters(userId);
    }
    
    async linkCharacterToUser(linkData: InsertUserCharacter): Promise<UserCharacter> {
      return super.linkCharacterToUser(linkData);
    }
    
    async verifyCharacterOwnership(userId: number, characterId: number): Promise<boolean> {
      return super.verifyCharacterOwnership(userId, characterId);
    }
    
    async setMainCharacter(userId: number, characterId: number): Promise<boolean> {
      return super.setMainCharacter(userId, characterId);
    }
    
    async userOwnsCharacter(userId: number, characterId: number): Promise<boolean> {
      return super.userOwnsCharacter(userId, characterId);
    }
    
    async getUserMainCharacter(userId: number): Promise<(Character & { isMain: boolean, verified: boolean }) | undefined> {
      return super.getUserMainCharacter(userId);
    }
    
    async verifyGuildMembership(userId: number): Promise<boolean> {
      return super.verifyGuildMembership(userId);
    }
  }
  
  storageImplementation = new MySqlStorageWithSession();
} else {
  console.log('Using PostgreSQL database storage implementation');
  storageImplementation = new StorageWithSession();
}

// Export a singleton instance
export const storage = storageImplementation;