-- Migration for MySQL 8 to add raid tier management system
-- Date: 2025-05-02
-- This file is specifically for MySQL 8 which has limitations with IF NOT EXISTS for ALTER TABLE

-- Create expansions table
CREATE TABLE IF NOT EXISTS `expansions` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` TEXT NOT NULL,
  `short_name` TEXT NOT NULL,
  `release_date` TIMESTAMP NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `order` INT NOT NULL,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create raid_tiers table
CREATE TABLE IF NOT EXISTS `raid_tiers` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` TEXT NOT NULL,
  `short_name` TEXT NOT NULL,
  `expansion_id` INT NOT NULL,
  `release_date` TIMESTAMP NOT NULL,
  `is_current` BOOLEAN DEFAULT FALSE,
  `order` INT NOT NULL,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add tier_id column to raid_progresses if it doesn't exist
-- First check if the column exists
SELECT COUNT(*) INTO @column_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'raid_progresses' 
AND COLUMN_NAME = 'tier_id'
AND TABLE_SCHEMA = DATABASE();

-- Add the column if it doesn't exist
SET @query = IF(@column_exists = 0, 
                'ALTER TABLE `raid_progresses` ADD COLUMN `tier_id` INT', 
                'SELECT "tier_id column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Insert The War Within expansion
-- First check if it already exists
SELECT COUNT(*) INTO @expansion_exists 
FROM `expansions` 
WHERE `short_name` = 'TWW';

-- Insert if it doesn't exist
SET @query = IF(@expansion_exists = 0,
                'INSERT INTO `expansions` (`name`, `short_name`, `release_date`, `is_active`, `order`) VALUES ("The War Within", "TWW", "2024-03-01", TRUE, 10)',
                'SELECT "The War Within expansion already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Get The War Within expansion ID
SELECT id INTO @expansion_id FROM `expansions` WHERE `short_name` = 'TWW' LIMIT 1;

-- Insert raid tiers for The War Within if they don't exist
-- Check for Nerub-ar Palace
SELECT COUNT(*) INTO @palace_exists 
FROM `raid_tiers` 
WHERE `name` = 'Nerub-ar Palace' AND `expansion_id` = @expansion_id;

-- Insert Nerub-ar Palace if it doesn't exist
SET @query = IF(@palace_exists = 0,
                CONCAT('INSERT INTO `raid_tiers` (`name`, `short_name`, `expansion_id`, `release_date`, `is_current`, `order`) VALUES ("Nerub-ar Palace", "Palace", ', @expansion_id, ', "2024-03-01", FALSE, 1)'),
                'SELECT "Nerub-ar Palace tier already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check for Liberation of Undermine
SELECT COUNT(*) INTO @undermine_exists 
FROM `raid_tiers` 
WHERE `name` = 'Liberation of Undermine' AND `expansion_id` = @expansion_id;

-- Insert Liberation of Undermine if it doesn't exist
SET @query = IF(@undermine_exists = 0,
                CONCAT('INSERT INTO `raid_tiers` (`name`, `short_name`, `expansion_id`, `release_date`, `is_current`, `order`) VALUES ("Liberation of Undermine", "Undermine", ', @expansion_id, ', "2024-04-15", TRUE, 2)'),
                'SELECT "Liberation of Undermine tier already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Get tier IDs
SELECT id INTO @nerub_id FROM `raid_tiers` WHERE `name` = 'Nerub-ar Palace' LIMIT 1;
SELECT id INTO @undermine_id FROM `raid_tiers` WHERE `name` = 'Liberation of Undermine' LIMIT 1;

-- Update existing raid progresses with tier IDs
UPDATE `raid_progresses`
SET `tier_id` = @nerub_id
WHERE `name` = 'Nerub-ar Palace' AND (`tier_id` IS NULL OR `tier_id` = 0);

UPDATE `raid_progresses`
SET `tier_id` = @undermine_id
WHERE `name` = 'Liberation of Undermine' AND (`tier_id` IS NULL OR `tier_id` = 0);