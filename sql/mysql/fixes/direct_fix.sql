-- Direct MySQL Fix Script
-- Run this directly on your MySQL database if you encounter table structure issues
-- This script doesn't use DELIMITER and stored procedures for better compatibility

-- Add missing columns to characters table
-- MySQL 8.0 doesn't support IF NOT EXISTS in ALTER TABLE ADD COLUMN
-- We'll use a procedure to check for column existence before adding
DELIMITER //
CREATE PROCEDURE add_column_if_not_exists(
    IN table_schema_param VARCHAR(255),
    IN table_name_param VARCHAR(255),
    IN column_name_param VARCHAR(255),
    IN column_definition TEXT
)
BEGIN
    DECLARE column_exists INT;
    
    SELECT COUNT(*) INTO column_exists
    FROM information_schema.columns
    WHERE table_schema = table_schema_param
      AND table_name = table_name_param
      AND column_name = column_name_param;
    
    IF column_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE `', table_name_param, '` ADD COLUMN `', column_name_param, '` ', column_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- Use current database name
SET @db_name = DATABASE();

-- Add columns if they don't exist
CALL add_column_if_not_exists(@db_name, 'characters', 'realm', 'TEXT');
CALL add_column_if_not_exists(@db_name, 'characters', 'role', 'TEXT');
CALL add_column_if_not_exists(@db_name, 'characters', 'raid_participation', 'JSON');
CALL add_column_if_not_exists(@db_name, 'characters', 'raider_io_score', 'INT');
CALL add_column_if_not_exists(@db_name, 'characters', 'last_active', 'TIMESTAMP NULL');
CALL add_column_if_not_exists(@db_name, 'characters', 'armory_link', 'TEXT');

-- Clean up the procedure
DROP PROCEDURE IF EXISTS add_column_if_not_exists;

-- Create website content management tables
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

CREATE TABLE IF NOT EXISTS `translations` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `key` VARCHAR(255) NOT NULL UNIQUE,
  `en_text` TEXT NOT NULL,
  `no_text` TEXT,
  `context` TEXT,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add default settings if they don't exist
INSERT IGNORE INTO `website_settings` (`key`, `value`, `description`, `type`, `category`)
VALUES 
('site_title', 'Guttakrutt - World of Warcraft Guild', 'Website title', 'string', 'general'),
('primary_color', '#4caf50', 'Primary theme color', 'string', 'appearance'),
('secondary_color', '#2e7d32', 'Secondary theme color', 'string', 'appearance'),
('discord_link', 'https://discord.gg/X3Wjdh4HvC', 'Discord invite link', 'string', 'social'),
('default_language', 'en', 'Default site language', 'string', 'general'),
('recruitment_open', 'true', 'Whether recruitment is open', 'boolean', 'recruitment');

-- Insert common translation strings if they don't exist
INSERT IGNORE INTO `translations` (`key`, `en_text`, `no_text`, `context`)
VALUES
('nav.home', 'Home', 'Hjem', 'Navigation menu'),
('nav.roster', 'Guild Roster', 'Guildrosteret', 'Navigation menu'),
('nav.progress', 'Progress', 'Fremgang', 'Navigation menu'),
('nav.join', 'Join Us', 'Bli med', 'Navigation menu'),
('header.welcome', 'Welcome to Guttakrutt', 'Velkommen til Guttakrutt', 'Hero section heading'),
('button.apply', 'Apply Now', 'Søk nå', 'Recruitment button');