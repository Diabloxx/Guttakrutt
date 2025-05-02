/**
 * Database schema with cross-database compatibility support for PostgreSQL and MySQL
 * 
 * This file defines the database schema using Drizzle ORM and automatically
 * selects the appropriate database dialect based on the DB_TYPE environment variable.
 * 
 * Important notes for MySQL compatibility:
 * - 'rank' is a reserved keyword in MySQL and needs backticks
 * - JSON data types use different implementations in MySQL and PostgreSQL
 * - MySQL doesn't support JSONB, so we use JSON instead
 */

import { pgTable, text as pgText, serial as pgSerial, integer as pgInteger, boolean as pgBoolean, timestamp as pgTimestamp, jsonb } from "drizzle-orm/pg-core";
import { mysqlTable, text as mysqlText, serial as mysqlSerial, int as mysqlInteger, boolean as mysqlBoolean, timestamp as mysqlTimestamp, json } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Determine which database engine to use based on environment variable
// This is evaluated at runtime in the server process
// Check if we're on guttakrutt.org (production) which uses MySQL
let dbType = typeof process !== 'undefined' && process.env ? (process.env.DB_TYPE || 'postgres') : 'postgres';

// Force MySQL if we detect we're in the guttakrutt.org environment or explicitly set in query params
if (typeof window !== 'undefined' && 
    (window.location.hostname.includes('guttakrutt.org') || 
     window.location.search.includes('db=mysql'))) {
  dbType = 'mysql';
}

// Allow overriding with a URL parameter for testing
if (typeof window !== 'undefined' && window.location.search.includes('db=postgres')) {
  dbType = 'postgres';
}

const useMySQL = dbType === 'mysql';

// Don't log this on client-side to avoid console noise
if (typeof process !== 'undefined') {
  console.log(`Schema using ${useMySQL ? 'MySQL' : 'PostgreSQL'} dialect`);
}

// Create generic table and column functions that work with both database types
export const createTable = useMySQL ? mysqlTable : pgTable;
export const text = useMySQL ? mysqlText : pgText;
export const serial = useMySQL ? mysqlSerial : pgSerial;
export const integer = useMySQL ? mysqlInteger : pgInteger;
export const boolean = useMySQL ? mysqlBoolean : pgBoolean;
export const timestamp = useMySQL ? mysqlTimestamp : pgTimestamp;
export const jsonData = useMySQL ? json : jsonb;

// Guild Schema
export const guilds = createTable("guilds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  realm: text("realm").notNull(),
  faction: text("faction").notNull(),
  description: text("description"),
  memberCount: integer("member_count"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  emblemUrl: text("emblem_url"),
  serverRegion: text("server_region").default("eu"),
});

export const insertGuildSchema = createInsertSchema(guilds).omit({
  id: true,
  lastUpdated: true,
});

// Characters Schema
export const characters = createTable("characters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  className: text("class_name").notNull(),
  specName: text("spec_name"),
  rank: integer("rank").notNull(), // Using quotation for MySQL reserved word
  level: integer("level").notNull(),
  avatarUrl: text("avatar_url"),
  itemLevel: integer("item_level"),
  guildId: integer("guild_id").notNull(),
  blizzardId: text("blizzard_id"),
  realm: text("realm"), // Store character's realm for cross-realm support
  role: text("role"), // Tank, Healer, DPS, etc.
  raidParticipation: jsonData("raid_participation"), // JSON data of raid participation history
  raiderIoScore: integer("raider_io_score"), // Store Raider.IO score
  lastActive: timestamp("last_active"), // When character was last active in a raid
  armoryLink: text("armory_link"), // Full URL to armory
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertCharacterSchema = createInsertSchema(characters).omit({
  id: true,
  lastUpdated: true,
});

// Raid Progress Schema
export const raidProgresses = createTable("raid_progresses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bosses: integer("bosses").notNull(),
  bossesDefeated: integer("bosses_defeated").notNull(),
  difficulty: text("difficulty").notNull(), // normal, heroic, mythic
  guildId: integer("guild_id").notNull(),
  worldRank: integer("world_rank"),
  regionRank: integer("region_rank"),
  realmRank: integer("realm_rank"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertRaidProgressSchema = createInsertSchema(raidProgresses).omit({
  id: true,
  lastUpdated: true,
});

// Raid Bosses Schema
export const raidBosses = createTable("raid_bosses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  raidName: text("raid_name").notNull(),
  iconUrl: text("icon_url"),
  // Removing firstKillDate as requested
  bestTime: text("best_time"),
  bestParse: text("best_parse"),
  pullCount: integer("pull_count").default(0), // Renamed from wipeCount to pullCount
  defeated: boolean("defeated").default(false),
  inProgress: boolean("in_progress").default(false), // New field to explicitly mark boss as in progress
  difficulty: text("difficulty").default("mythic"), // normal, heroic, mythic
  guildId: integer("guild_id").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  // Enhanced API integration fields
  bossId: text("boss_id"), // Blizzard/RaiderIO boss identifier
  encounterID: integer("encounter_id"), // For WarcraftLogs
  // WarcraftLogs integration fields
  warcraftLogsId: text("warcraftlogs_id"),
  dpsRanking: integer("dps_ranking"), // Percentile ranking
  healingRanking: integer("healing_ranking"),
  tankRanking: integer("tank_ranking"),
  lastKillDate: timestamp("last_kill_date"),
  killCount: integer("kill_count"),
  fastestKill: text("fastest_kill"), // Formatted as MM:SS
  reportUrl: text("report_url"), // URL to WarcraftLogs report
  // Store raw API response data for debugging and future use
  raiderIoData: jsonData("raider_io_data"),
  warcraftLogsData: jsonData("warcraft_logs_data")
});

export const insertRaidBossSchema = createInsertSchema(raidBosses).omit({
  id: true,
  lastUpdated: true,
});

// User Authentication Schema
export const users = createTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // Username for standard login
  email: text("email").unique(), // Email address
  password: text("password"), // Hashed password
  displayName: text("display_name"), // Display name
  // Legacy Battle.net fields (optional now)
  battleNetId: text("battle_net_id").unique(), // Battle.net unique identifier (now optional)
  battleTag: text("battle_tag"), // BattleTag (e.g., "User#1234")
  accessToken: text("access_token"), // Current OAuth access token
  refreshToken: text("refresh_token"), // OAuth refresh token
  tokenExpiry: timestamp("token_expiry"), // When the access token expires
  lastLogin: timestamp("last_login").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isGuildMember: boolean("is_guild_member").default(false), // Whether user belongs to the guild
  isOfficer: boolean("is_officer").default(false), // Officer status for additional permissions
  region: text("region").default("eu"), // us, eu, kr, tw, cn
  locale: text("locale").default("en_GB"), // User's locale preference
  avatarUrl: text("avatar_url"), // User avatar URL
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  lastLogin: true,
  createdAt: true,
});

// User-Character relationships
export const userCharacters = createTable("user_characters", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  characterId: integer("character_id").notNull().references(() => characters.id),
  isMain: boolean("is_main").default(false), // Whether this is the user's main character
  verified: boolean("verified").default(false), // Whether ownership has been verified
  verifiedAt: timestamp("verified_at"), // When ownership was verified
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserCharacterSchema = createInsertSchema(userCharacters).omit({
  id: true,
  verifiedAt: true,
  createdAt: true,
});

// Export Types
export type Guild = typeof guilds.$inferSelect;
export type InsertGuild = z.infer<typeof insertGuildSchema>;

export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;

export type RaidProgress = typeof raidProgresses.$inferSelect;
export type InsertRaidProgress = z.infer<typeof insertRaidProgressSchema>;

export type RaidBoss = typeof raidBosses.$inferSelect;
export type InsertRaidBoss = z.infer<typeof insertRaidBossSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserCharacter = typeof userCharacters.$inferSelect;
export type InsertUserCharacter = z.infer<typeof insertUserCharacterSchema>;

// Admin User Schema
export const adminUsers = createTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  lastLogin: timestamp("last_login"),
  lastUpdated: timestamp("last_updated").defaultNow()
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  lastLogin: true,
  lastUpdated: true,
});

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;

// Recruitment Application System
export const applications = createTable("applications", {
  id: serial("id").primaryKey(),
  characterName: text("character_name").notNull(),
  className: text("class_name").notNull(),
  specName: text("spec_name").notNull(),
  realm: text("realm").notNull(),
  itemLevel: integer("item_level"),
  experience: text("experience").notNull(),
  availability: text("availability").notNull(),
  contactInfo: text("contact_info").notNull(),
  whyJoin: text("why_join").notNull(),
  raiders: text("raiders_known"), // Any raiders known in the guild
  referredBy: text("referred_by"), // Who referred them
  additionalInfo: text("additional_info"),
  logs: text("logs"), // WarcraftLogs links
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  reviewedBy: integer("reviewed_by").references(() => adminUsers.id),
  reviewNotes: text("review_notes"),
  reviewDate: timestamp("review_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  status: true,
  reviewedBy: true,
  reviewNotes: true,
  reviewDate: true,
  createdAt: true,
  updatedAt: true
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

// Application Notifications
export const applicationNotifications = createTable("application_notifications", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applications.id),
  adminId: integer("admin_id").references(() => adminUsers.id),
  read: boolean("read").notNull().default(false),
  notificationType: text("notification_type").notNull(), // new, status_change, comment
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertApplicationNotificationSchema = createInsertSchema(applicationNotifications).omit({
  id: true,
  createdAt: true
});

export type ApplicationNotification = typeof applicationNotifications.$inferSelect;
export type InsertApplicationNotification = z.infer<typeof insertApplicationNotificationSchema>;

// Application Comments
export const applicationComments = createTable("application_comments", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applications.id),
  adminId: integer("admin_id").notNull().references(() => adminUsers.id),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertApplicationCommentSchema = createInsertSchema(applicationComments).omit({
  id: true,
  createdAt: true
});

export type ApplicationComment = typeof applicationComments.$inferSelect;
export type InsertApplicationComment = z.infer<typeof insertApplicationCommentSchema>;

// Website Content Management

// Pages and content
export const websiteContent = createTable("website_content", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // Unique identifier for the content (e.g., "home_page_hero", "about_section")
  title: text("title").notNull(),
  content: text("content").notNull(), // HTML content
  contentEn: text("content_en").notNull(), // English content
  contentNo: text("content_no"), // Norwegian content
  isPublished: boolean("is_published").default(true),
  lastUpdated: timestamp("last_updated").defaultNow(),
  updatedBy: integer("updated_by").references(() => adminUsers.id),
});

export const insertWebsiteContentSchema = createInsertSchema(websiteContent).omit({
  id: true,
  lastUpdated: true,
});

export type WebsiteContent = typeof websiteContent.$inferSelect;
export type InsertWebsiteContent = z.infer<typeof insertWebsiteContentSchema>;

// Media files
export const mediaFiles = createTable("media_files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  path: text("path").notNull(),
  fileType: text("file_type").notNull(), // image, video, document
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // File size in bytes
  width: integer("width"), // For images
  height: integer("height"), // For images
  title: text("title"),
  description: text("description"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  uploadedBy: integer("uploaded_by").references(() => adminUsers.id),
});

export const insertMediaFileSchema = createInsertSchema(mediaFiles).omit({
  id: true,
  uploadedAt: true,
});

export type MediaFile = typeof mediaFiles.$inferSelect;
export type InsertMediaFile = z.infer<typeof insertMediaFileSchema>;

// Website settings
export const websiteSettings = createTable("website_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // Unique identifier for the setting
  value: text("value").notNull(),
  description: text("description"),
  type: text("type").notNull(), // string, number, boolean, json
  category: text("category").notNull(), // appearance, general, recruitment, etc.
  lastUpdated: timestamp("last_updated").defaultNow(),
  updatedBy: integer("updated_by").references(() => adminUsers.id),
});

export const insertWebsiteSettingSchema = createInsertSchema(websiteSettings).omit({
  id: true,
  lastUpdated: true,
});

export type WebsiteSetting = typeof websiteSettings.$inferSelect;
export type InsertWebsiteSetting = z.infer<typeof insertWebsiteSettingSchema>;

// Translation strings
export const translations = createTable("translations", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // Translation key (e.g., "nav.home", "button.submit")
  enText: text("en_text").notNull(), // English translation
  noText: text("no_text"), // Norwegian translation
  context: text("context"), // Description/context for translators
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertTranslationSchema = createInsertSchema(translations).omit({
  id: true,
  lastUpdated: true,
});

export type Translation = typeof translations.$inferSelect;
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;

// Web Log Schema for tracking system operations and admin actions
export const webLogs = createTable("web_logs", {
  id: serial("id").primaryKey(),
  operation: text("operation").notNull(), // Type of operation (e.g., refresh_members, update_scores)
  status: text("status").notNull(), // success, error, warning, info
  details: text("details"), // Detailed message about the operation
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: integer("user_id").references(() => adminUsers.id), // Admin user who triggered operation (if applicable)
  duration: integer("duration"), // Duration of operation in milliseconds (if applicable)
  ipAddress: text("ip_address"), // IP address of the user who triggered the operation
  userAgent: text("user_agent"), // Browser/user agent of the user who triggered the operation
  metadata: text("metadata"), // JSON string containing additional structured data about the operation
});

export const insertWebLogSchema = createInsertSchema(webLogs).omit({
  id: true,
});

export type WebLog = typeof webLogs.$inferSelect;
export type InsertWebLog = z.infer<typeof insertWebLogSchema>;
