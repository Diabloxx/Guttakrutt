-- Migration to add tier_id and boss_order columns to raid_bosses table (MySQL 8 compatible)
-- For MySQL 8, which doesn't support IF NOT EXISTS for ALTER TABLE
-- First check if the columns exist, then add them if they don't

SET @exist_tier_id := (SELECT COUNT(*) 
                  FROM INFORMATION_SCHEMA.COLUMNS 
                  WHERE TABLE_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'raid_bosses' 
                  AND COLUMN_NAME = 'tier_id');
                  
SET @exist_boss_order := (SELECT COUNT(*) 
                  FROM INFORMATION_SCHEMA.COLUMNS 
                  WHERE TABLE_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'raid_bosses' 
                  AND COLUMN_NAME = 'boss_order');

SET @add_tier_id = CONCAT('ALTER TABLE raid_bosses ADD COLUMN tier_id INT');
SET @add_boss_order = CONCAT('ALTER TABLE raid_bosses ADD COLUMN boss_order INT DEFAULT 0');

PREPARE stmt1 FROM @add_tier_id;
PREPARE stmt2 FROM @add_boss_order;

-- Only execute if the columns don't exist
SET @exec_tier_id := IF(@exist_tier_id = 0, 'stmt1', 'SELECT 1');
SET @exec_boss_order := IF(@exist_boss_order = 0, 'stmt2', 'SELECT 1');

EXECUTE stmt1;
EXECUTE stmt2;

DEALLOCATE PREPARE stmt1;
DEALLOCATE PREPARE stmt2;