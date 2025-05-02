-- Migration for MySQL to add raid tier management system
-- Date: 2025-05-02

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
SET @s = (SELECT IF(
    EXISTS(
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'raid_progresses'
        AND COLUMN_NAME = 'tier_id'
        AND TABLE_SCHEMA = DATABASE()
    ),
    'SELECT 1',
    'ALTER TABLE `raid_progresses` ADD COLUMN `tier_id` INT'
));

PREPARE stmt FROM @s;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Insert The War Within expansion
INSERT IGNORE INTO `expansions` (`name`, `short_name`, `release_date`, `is_active`, `order`) 
VALUES ('The War Within', 'TWW', '2024-03-01', TRUE, 10);

-- Insert raid tiers for The War Within
SET @expansion_id = (SELECT id FROM expansions WHERE short_name = 'TWW' LIMIT 1);

INSERT IGNORE INTO `raid_tiers` (`name`, `short_name`, `expansion_id`, `release_date`, `is_current`, `order`)
VALUES 
('Nerub-ar Palace', 'Palace', @expansion_id, '2024-03-01', FALSE, 1),
('Liberation of Undermine', 'Undermine', @expansion_id, '2024-04-15', TRUE, 2);

-- Update existing raid progresses with tier IDs
SET @nerub_id = (SELECT id FROM raid_tiers WHERE name = 'Nerub-ar Palace' LIMIT 1);
SET @undermine_id = (SELECT id FROM raid_tiers WHERE name = 'Liberation of Undermine' LIMIT 1);

UPDATE `raid_progresses`
SET `tier_id` = @nerub_id
WHERE `name` = 'Nerub-ar Palace';

UPDATE `raid_progresses`
SET `tier_id` = @undermine_id
WHERE `name` = 'Liberation of Undermine';