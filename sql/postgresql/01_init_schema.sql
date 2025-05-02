-- PostgreSQL Init Schema Script
-- Creates the initial database schema for the Guttakrutt guild website
-- Compatible with PostgreSQL 12+ 

-- Create admin_users table
CREATE TABLE IF NOT EXISTS "admin_users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "last_login" TIMESTAMP,
  "last_updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create guilds table
CREATE TABLE IF NOT EXISTS "guilds" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "realm" TEXT NOT NULL,
  "faction" TEXT NOT NULL,
  "description" TEXT,
  "member_count" INTEGER,
  "last_updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "emblem_url" TEXT,
  "server_region" TEXT DEFAULT 'eu'
);

-- Create characters table
CREATE TABLE IF NOT EXISTS "characters" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "class_name" TEXT NOT NULL,
  "spec_name" TEXT,
  "rank" INTEGER NOT NULL,
  "level" INTEGER NOT NULL,
  "avatar_url" TEXT,
  "item_level" INTEGER,
  "guild_id" INTEGER NOT NULL,
  "blizzard_id" TEXT,
  "realm" TEXT,
  "role" TEXT,
  "raid_participation" JSONB,
  "raider_io_score" INTEGER,
  "last_active" TIMESTAMP,
  "armory_link" TEXT,
  "last_updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create raid_progresses table
CREATE TABLE IF NOT EXISTS "raid_progresses" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "bosses" INTEGER NOT NULL,
  "bosses_defeated" INTEGER NOT NULL,
  "difficulty" TEXT NOT NULL,
  "guild_id" INTEGER NOT NULL,
  "world_rank" INTEGER,
  "region_rank" INTEGER,
  "realm_rank" INTEGER,
  "last_updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create raid_bosses table
CREATE TABLE IF NOT EXISTS "raid_bosses" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "raid_name" TEXT NOT NULL,
  "icon_url" TEXT,
  "best_time" TEXT,
  "best_parse" TEXT,
  "pull_count" INTEGER,
  "defeated" BOOLEAN,
  "in_progress" BOOLEAN,
  "difficulty" TEXT NOT NULL,
  "guild_id" INTEGER NOT NULL,
  "last_updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "boss_id" INTEGER,
  "encounter_id" INTEGER,
  "warcraftlogs_id" INTEGER,
  "dps_ranking" TEXT,
  "healing_ranking" TEXT,
  "tank_ranking" TEXT,
  "last_kill_date" TIMESTAMP,
  "kill_count" INTEGER,
  "fastest_kill" TEXT,
  "report_url" TEXT,
  "raider_io_data" JSONB,
  "warcraft_logs_data" JSONB
);

-- Create applications table
CREATE TABLE IF NOT EXISTS "applications" (
  "id" SERIAL PRIMARY KEY,
  "character_name" TEXT NOT NULL,
  "realm" TEXT NOT NULL,
  "class_name" TEXT NOT NULL,
  "spec_name" TEXT NOT NULL,
  "item_level" INTEGER NOT NULL,
  "contact_info" TEXT NOT NULL,
  "experience" TEXT,
  "logs" TEXT,
  "additional_info" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "last_updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "reviewed_by" INTEGER,
  "review_notes" TEXT,
  "availability" TEXT,
  "why_join" TEXT,
  "raiders" TEXT,
  "referred_by" TEXT
);

-- Create application_comments table
CREATE TABLE IF NOT EXISTS "application_comments" (
  "id" SERIAL PRIMARY KEY,
  "application_id" INTEGER NOT NULL,
  "admin_id" INTEGER NOT NULL,
  "comment" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE,
  FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id")
);

-- Create application_notifications table
CREATE TABLE IF NOT EXISTS "application_notifications" (
  "id" SERIAL PRIMARY KEY,
  "application_id" INTEGER NOT NULL,
  "admin_id" INTEGER NOT NULL,
  "message" TEXT NOT NULL,
  "is_read" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE,
  FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id")
);

-- Create website content tables
CREATE TABLE IF NOT EXISTS "website_content" (
  "id" SERIAL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "content_en" TEXT NOT NULL,
  "content_no" TEXT,
  "is_published" BOOLEAN DEFAULT TRUE,
  "last_updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_by" INTEGER REFERENCES "admin_users"("id")
);

CREATE TABLE IF NOT EXISTS "media_files" (
  "id" SERIAL PRIMARY KEY,
  "filename" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "file_type" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "title" TEXT,
  "description" TEXT,
  "uploaded_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "uploaded_by" INTEGER REFERENCES "admin_users"("id")
);

CREATE TABLE IF NOT EXISTS "website_settings" (
  "id" SERIAL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "value" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "last_updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_by" INTEGER REFERENCES "admin_users"("id")
);

CREATE TABLE IF NOT EXISTS "translations" (
  "id" SERIAL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "en_text" TEXT NOT NULL,
  "no_text" TEXT,
  "context" TEXT,
  "last_updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);