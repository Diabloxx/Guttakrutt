-- PostgreSQL Full Setup Script
-- This script creates all the tables needed for the Guttakrutt guild website
-- It's designed for PostgreSQL compatibility

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
  "pull_count" INTEGER DEFAULT 0,
  "defeated" BOOLEAN DEFAULT FALSE,
  "in_progress" BOOLEAN DEFAULT FALSE,
  "difficulty" TEXT DEFAULT 'mythic',
  "guild_id" INTEGER NOT NULL,
  "last_updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "boss_id" TEXT,
  "encounter_id" INTEGER,
  "warcraftlogs_id" TEXT,
  "dps_ranking" INTEGER,
  "healing_ranking" INTEGER,
  "tank_ranking" INTEGER,
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
  "class_name" TEXT NOT NULL,
  "spec_name" TEXT NOT NULL,
  "realm" TEXT NOT NULL,
  "item_level" INTEGER,
  "experience" TEXT NOT NULL,
  "availability" TEXT NOT NULL,
  "contact_info" TEXT NOT NULL,
  "why_join" TEXT NOT NULL,
  "raiders_known" TEXT,
  "referred_by" TEXT,
  "additional_info" TEXT,
  "logs" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "reviewed_by" INTEGER REFERENCES "admin_users"("id"),
  "review_notes" TEXT,
  "review_date" TIMESTAMP,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create application notifications
CREATE TABLE IF NOT EXISTS "application_notifications" (
  "id" SERIAL PRIMARY KEY,
  "application_id" INTEGER NOT NULL REFERENCES "applications"("id"),
  "admin_id" INTEGER REFERENCES "admin_users"("id"),
  "read" BOOLEAN NOT NULL DEFAULT FALSE,
  "notification_type" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create application comments
CREATE TABLE IF NOT EXISTS "application_comments" (
  "id" SERIAL PRIMARY KEY,
  "application_id" INTEGER NOT NULL REFERENCES "applications"("id"),
  "admin_id" INTEGER NOT NULL REFERENCES "admin_users"("id"),
  "comment" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Website Content Management Tables

-- Create website_content table
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

-- Create media_files table
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

-- Create website_settings table
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

-- Create translations table
CREATE TABLE IF NOT EXISTS "translations" (
  "id" SERIAL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "en_text" TEXT NOT NULL,
  "no_text" TEXT,
  "context" TEXT,
  "last_updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (username: admin, password: admin)
INSERT INTO "admin_users" ("username", "password")
VALUES ('admin', '$2b$10$Nvv4WMsYQKGJxhGlVe5tJOiM/R2qPcPOyvLJfuUY5Jje01RYRNhNa')
ON CONFLICT ("username") DO NOTHING;

-- Add default content
INSERT INTO website_settings ("key", "value", "description", "type", "category")
VALUES 
('site_title', 'Guttakrutt - World of Warcraft Guild', 'Website title', 'string', 'general'),
('primary_color', '#4caf50', 'Primary theme color', 'string', 'appearance'),
('secondary_color', '#2e7d32', 'Secondary theme color', 'string', 'appearance'),
('discord_link', 'https://discord.gg/X3Wjdh4HvC', 'Discord invite link', 'string', 'social'),
('default_language', 'en', 'Default site language', 'string', 'general'),
('recruitment_open', 'true', 'Whether recruitment is open', 'boolean', 'recruitment')
ON CONFLICT ("key") DO NOTHING;

-- Insert common translation strings
INSERT INTO translations ("key", "en_text", "no_text", "context")
VALUES
('nav.home', 'Home', 'Hjem', 'Navigation menu'),
('nav.roster', 'Guild Roster', 'Guildrosteret', 'Navigation menu'),
('nav.progress', 'Progress', 'Fremgang', 'Navigation menu'),
('nav.join', 'Join Us', 'Bli med', 'Navigation menu'),
('header.welcome', 'Welcome to Guttakrutt', 'Velkommen til Guttakrutt', 'Hero section heading'),
('button.apply', 'Apply Now', 'Søk nå', 'Recruitment button')
ON CONFLICT ("key") DO NOTHING;