-- PostgreSQL Migration Script

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "battleNetId" TEXT NOT NULL UNIQUE,
  "battleTag" TEXT NOT NULL,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT NOT NULL,
  "tokenExpiry" TIMESTAMP NOT NULL,
  "region" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "isGuildMember" BOOLEAN DEFAULT FALSE,
  "isOfficer" BOOLEAN DEFAULT FALSE,
  "email" TEXT,
  "avatarUrl" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "lastLogin" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on battleNetId for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_battlenet_id ON users("battleNetId");

-- Add new columns to characters table
ALTER TABLE "characters" 
ADD COLUMN IF NOT EXISTS "realm" TEXT,
ADD COLUMN IF NOT EXISTS "role" TEXT,
ADD COLUMN IF NOT EXISTS "raid_participation" JSONB,
ADD COLUMN IF NOT EXISTS "raider_io_score" INTEGER,
ADD COLUMN IF NOT EXISTS "last_active" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "armory_link" TEXT;

-- Create website content management tables
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

-- Add web_logs table for tracking system operations
CREATE TABLE IF NOT EXISTS web_logs (
  id SERIAL PRIMARY KEY,
  operation VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  details TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  user_id INTEGER REFERENCES admin_users(id),
  duration INTEGER,
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Create index on timestamp for faster retrieval of logs by date
CREATE INDEX IF NOT EXISTS idx_web_logs_timestamp ON web_logs(timestamp);

-- Create index on operation for filtering logs by operation type
CREATE INDEX IF NOT EXISTS idx_web_logs_operation ON web_logs(operation);

-- Create index on status for filtering logs by status
CREATE INDEX IF NOT EXISTS idx_web_logs_status ON web_logs(status);

-- Create index on user_id for filtering logs by user
CREATE INDEX IF NOT EXISTS idx_web_logs_user_id ON web_logs(user_id);

-- Add metadata column to web_logs table for security scanner logs
ALTER TABLE web_logs ADD COLUMN IF NOT EXISTS metadata TEXT;