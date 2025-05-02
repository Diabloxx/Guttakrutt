-- MySQL 8 Schema Fix Script
-- This script fixes issues with missing columns in the characters table
-- and ensures all content management tables exist

-- Function to check if a column exists and add it if it doesn't
DELIMITER //
CREATE PROCEDURE add_column_if_not_exists(
    IN table_name VARCHAR(255),
    IN column_name VARCHAR(255),
    IN column_definition TEXT
)
BEGIN
    DECLARE CONTINUE HANDLER FOR 1060 BEGIN END;  -- Ignore "Duplicate column" errors
    SET @stmt = CONCAT('ALTER TABLE `', table_name, '` ADD COLUMN `', column_name, '` ', column_definition);
    PREPARE stmt FROM @stmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END //
DELIMITER ;

-- Add missing columns to characters table
CALL add_column_if_not_exists('characters', 'realm', 'TEXT');
CALL add_column_if_not_exists('characters', 'role', 'TEXT');
CALL add_column_if_not_exists('characters', 'raid_participation', 'JSON');
CALL add_column_if_not_exists('characters', 'raider_io_score', 'INT');
CALL add_column_if_not_exists('characters', 'last_active', 'TIMESTAMP NULL');
CALL add_column_if_not_exists('characters', 'armory_link', 'TEXT');

-- Create website content management tables if they don't exist
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

-- Add default content if tables are empty
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

-- Clean up
DROP PROCEDURE IF EXISTS add_column_if_not_exists;