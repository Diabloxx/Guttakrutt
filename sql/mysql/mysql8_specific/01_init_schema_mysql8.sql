-- MySQL 8.0 Init Schema Script
-- Creates the initial database schema for the Guttakrutt guild website
-- Compatible with MySQL 8.0+ without using IF NOT EXISTS for ALTER TABLE

-- First, create the schema checker helper procedure
DELIMITER //
CREATE PROCEDURE create_table_if_not_exists(
    IN table_name_param VARCHAR(255),
    IN create_statement TEXT
)
BEGIN
    DECLARE table_exists INT;
    
    -- Check if the table exists
    SELECT COUNT(*) INTO table_exists
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = table_name_param;
    
    -- Create the table if it doesn't exist
    IF table_exists = 0 THEN
        SET @sql = create_statement;
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- Create admin_users table
CALL create_table_if_not_exists('admin_users', 
'CREATE TABLE `admin_users` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `password` TEXT NOT NULL,
  `last_login` TIMESTAMP NULL,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)');

-- Create guilds table
CALL create_table_if_not_exists('guilds', 
'CREATE TABLE `guilds` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` TEXT NOT NULL,
  `realm` TEXT NOT NULL,
  `faction` TEXT NOT NULL,
  `description` TEXT,
  `member_count` INT,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `emblem_url` TEXT,
  `server_region` TEXT DEFAULT "eu"
)');

-- Create characters table
CALL create_table_if_not_exists('characters', 
'CREATE TABLE `characters` (
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
)');

-- Create raid_progresses table
CALL create_table_if_not_exists('raid_progresses', 
'CREATE TABLE `raid_progresses` (
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
)');

-- Create raid_bosses table
CALL create_table_if_not_exists('raid_bosses', 
'CREATE TABLE `raid_bosses` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` TEXT NOT NULL,
  `raid_name` TEXT NOT NULL,
  `icon_url` TEXT,
  `best_time` TEXT,
  `best_parse` TEXT,
  `pull_count` INT,
  `defeated` BOOLEAN,
  `in_progress` BOOLEAN,
  `difficulty` TEXT NOT NULL,
  `guild_id` INT NOT NULL,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `boss_id` INT,
  `encounter_id` INT,
  `warcraftlogs_id` INT,
  `dps_ranking` TEXT,
  `healing_ranking` TEXT,
  `tank_ranking` TEXT,
  `last_kill_date` TIMESTAMP NULL,
  `kill_count` INT,
  `fastest_kill` TEXT,
  `report_url` TEXT,
  `raider_io_data` JSON,
  `warcraft_logs_data` JSON
)');

-- Create applications table
CALL create_table_if_not_exists('applications', 
'CREATE TABLE `applications` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `character_name` TEXT NOT NULL,
  `realm` TEXT NOT NULL,
  `class_name` TEXT NOT NULL,
  `spec_name` TEXT NOT NULL,
  `item_level` INT NOT NULL,
  `contact_info` TEXT NOT NULL,
  `experience` TEXT,
  `logs` TEXT,
  `additional_info` TEXT,
  `status` TEXT NOT NULL DEFAULT "pending",
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `reviewed_by` INT,
  `review_notes` TEXT,
  `availability` TEXT,
  `why_join` TEXT,
  `raiders` TEXT,
  `referred_by` TEXT
)');

-- Create application_comments table
CALL create_table_if_not_exists('application_comments', 
'CREATE TABLE `application_comments` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `application_id` INT NOT NULL,
  `admin_id` INT NOT NULL,
  `comment` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`admin_id`) REFERENCES `admin_users`(`id`)
)');

-- Create application_notifications table
CALL create_table_if_not_exists('application_notifications', 
'CREATE TABLE `application_notifications` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `application_id` INT NOT NULL,
  `admin_id` INT NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`admin_id`) REFERENCES `admin_users`(`id`)
)');

-- Create website content tables
CALL create_table_if_not_exists('website_content', 
'CREATE TABLE `website_content` (
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
)');

CALL create_table_if_not_exists('media_files', 
'CREATE TABLE `media_files` (
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
)');

CALL create_table_if_not_exists('website_settings', 
'CREATE TABLE `website_settings` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(255) NOT NULL UNIQUE,
  `value` TEXT NOT NULL,
  `description` TEXT,
  `type` TEXT NOT NULL,
  `category` TEXT NOT NULL,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_by` INT,
  FOREIGN KEY (`updated_by`) REFERENCES `admin_users`(`id`)
)');

CALL create_table_if_not_exists('translations', 
'CREATE TABLE `translations` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(255) NOT NULL UNIQUE,
  `en_text` TEXT NOT NULL,
  `no_text` TEXT,
  `context` TEXT,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)');

-- Clean up by dropping the helper procedure
DROP PROCEDURE IF EXISTS create_table_if_not_exists;