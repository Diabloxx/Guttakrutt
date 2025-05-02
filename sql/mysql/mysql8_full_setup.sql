-- MySQL 8 Full Setup Script
-- This script creates all the tables needed for the Guttakrutt guild website
-- It's compatible with MySQL 8.0+ and creates all necessary tables

-- Create admin_users table
CREATE TABLE IF NOT EXISTS `admin_users` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `password` TEXT NOT NULL,
  `last_login` TIMESTAMP NULL,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create guilds table
CREATE TABLE IF NOT EXISTS `guilds` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` TEXT NOT NULL,
  `realm` TEXT NOT NULL,
  `faction` TEXT NOT NULL,
  `description` TEXT,
  `member_count` INT,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `emblem_url` TEXT,
  `server_region` TEXT DEFAULT 'eu'
);

-- Create characters table
CREATE TABLE IF NOT EXISTS `characters` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` TEXT NOT NULL,
  `class_name` TEXT NOT NULL,
  `spec_name` TEXT,
  `rank` INT NOT NULL,
  `level` INT NOT NULL,
  `avatar_url` TEXT,
  `item_level` INT,
  `guild_id` INT NOT NULL,
  `blizzard_id` TEXT,
  `realm` TEXT,
  `role` TEXT,
  `raid_participation` JSON,
  `raider_io_score` INT,
  `last_active` TIMESTAMP NULL,
  `armory_link` TEXT,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create raid_progresses table
CREATE TABLE IF NOT EXISTS `raid_progresses` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` TEXT NOT NULL,
  `bosses` INT NOT NULL,
  `bosses_defeated` INT NOT NULL,
  `difficulty` TEXT NOT NULL,
  `guild_id` INT NOT NULL,
  `world_rank` INT,
  `region_rank` INT,
  `realm_rank` INT,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create raid_bosses table
CREATE TABLE IF NOT EXISTS `raid_bosses` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` TEXT NOT NULL,
  `raid_name` TEXT NOT NULL,
  `icon_url` TEXT,
  `best_time` TEXT,
  `best_parse` TEXT,
  `pull_count` INT DEFAULT 0,
  `defeated` BOOLEAN DEFAULT FALSE,
  `in_progress` BOOLEAN DEFAULT FALSE,
  `difficulty` TEXT DEFAULT 'mythic',
  `guild_id` INT NOT NULL,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `boss_id` TEXT,
  `encounter_id` INT,
  `warcraftlogs_id` TEXT,
  `dps_ranking` INT,
  `healing_ranking` INT,
  `tank_ranking` INT,
  `last_kill_date` TIMESTAMP NULL,
  `kill_count` INT,
  `fastest_kill` TEXT,
  `report_url` TEXT,
  `raider_io_data` JSON,
  `warcraft_logs_data` JSON
);

-- Create applications table
CREATE TABLE IF NOT EXISTS `applications` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `character_name` TEXT NOT NULL,
  `class_name` TEXT NOT NULL,
  `spec_name` TEXT NOT NULL,
  `realm` TEXT NOT NULL,
  `item_level` INT,
  `experience` TEXT NOT NULL,
  `availability` TEXT NOT NULL,
  `contact_info` TEXT NOT NULL,
  `why_join` TEXT NOT NULL,
  `raiders_known` TEXT,
  `referred_by` TEXT,
  `additional_info` TEXT,
  `logs` TEXT,
  `status` TEXT NOT NULL DEFAULT 'pending',
  `reviewed_by` INT,
  `review_notes` TEXT,
  `review_date` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`reviewed_by`) REFERENCES `admin_users`(`id`)
);

-- Create application notifications
CREATE TABLE IF NOT EXISTS `application_notifications` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `application_id` INT NOT NULL,
  `admin_id` INT,
  `read` BOOLEAN NOT NULL DEFAULT FALSE,
  `notification_type` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`),
  FOREIGN KEY (`admin_id`) REFERENCES `admin_users`(`id`)
);

-- Create application comments
CREATE TABLE IF NOT EXISTS `application_comments` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `application_id` INT NOT NULL,
  `admin_id` INT NOT NULL,
  `comment` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`),
  FOREIGN KEY (`admin_id`) REFERENCES `admin_users`(`id`)
);

-- Website Content Management Tables

-- Create website_content table
CREATE TABLE IF NOT EXISTS `website_content` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(255) NOT NULL UNIQUE,
  `title` TEXT NOT NULL,
  `content` TEXT NOT NULL,
  `content_en` TEXT NOT NULL,
  `content_no` TEXT,
  `is_published` BOOLEAN DEFAULT TRUE,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_by` INT,
  FOREIGN KEY (`updated_by`) REFERENCES `admin_users`(`id`)
);

-- Create media_files table
CREATE TABLE IF NOT EXISTS `media_files` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `filename` TEXT NOT NULL,
  `path` TEXT NOT NULL,
  `file_type` TEXT NOT NULL,
  `mime_type` TEXT NOT NULL,
  `size` INT NOT NULL,
  `width` INT,
  `height` INT,
  `title` TEXT,
  `description` TEXT,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `uploaded_by` INT,
  FOREIGN KEY (`uploaded_by`) REFERENCES `admin_users`(`id`)
);

-- Create website_settings table
CREATE TABLE IF NOT EXISTS `website_settings` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(255) NOT NULL UNIQUE,
  `value` TEXT NOT NULL,
  `description` TEXT,
  `type` TEXT NOT NULL,
  `category` TEXT NOT NULL,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_by` INT,
  FOREIGN KEY (`updated_by`) REFERENCES `admin_users`(`id`)
);

-- Create translations table
CREATE TABLE IF NOT EXISTS `translations` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(255) NOT NULL UNIQUE,
  `en_text` TEXT NOT NULL,
  `no_text` TEXT,
  `context` TEXT,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (username: admin, password: admin)
INSERT IGNORE INTO `admin_users` (`username`, `password`)
VALUES ('admin', '$2b$10$Nvv4WMsYQKGJxhGlVe5tJOiM/R2qPcPOyvLJfuUY5Jje01RYRNhNa');

-- Add default content
INSERT IGNORE INTO `website_settings` (`key`, `value`, `description`, `type`, `category`)
VALUES 
('site_title', 'Guttakrutt - World of Warcraft Guild', 'Website title', 'string', 'general'),
('primary_color', '#4caf50', 'Primary theme color', 'string', 'appearance'),
('secondary_color', '#2e7d32', 'Secondary theme color', 'string', 'appearance'),
('discord_link', 'https://discord.gg/X3Wjdh4HvC', 'Discord invite link', 'string', 'social'),
('default_language', 'en', 'Default site language', 'string', 'general'),
('recruitment_open', 'true', 'Whether recruitment is open', 'boolean', 'recruitment');

-- Insert common translation strings
INSERT IGNORE INTO `translations` (`key`, `en_text`, `no_text`, `context`)
VALUES
('nav.home', 'Home', 'Hjem', 'Navigation menu'),
('nav.roster', 'Guild Roster', 'Guildrosteret', 'Navigation menu'),
('nav.progress', 'Progress', 'Fremgang', 'Navigation menu'),
('nav.join', 'Join Us', 'Bli med', 'Navigation menu'),
('header.welcome', 'Welcome to Guttakrutt', 'Velkommen til Guttakrutt', 'Hero section heading'),
('button.apply', 'Apply Now', 'Søk nå', 'Recruitment button');