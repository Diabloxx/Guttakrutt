-- Migration: Add character fields
-- Adds realm, role, and raider_io_score fields to characters table
-- Compatible with MySQL 8.0+

-- Load the column checker utility if not already loaded
SOURCE utilities/mysql8_column_checker.sql;

-- Add realm field
CALL add_column_if_not_exists('characters', 'realm', 'VARCHAR(255) NULL');

-- Add role field for character role (tank, healer, dps)
CALL add_column_if_not_exists('characters', 'role', 'VARCHAR(50) NULL');

-- Add raider_io_score field for Mythic+ score
CALL add_column_if_not_exists('characters', 'raider_io_score', 'INT NULL');

-- Add active_spec_name field
CALL add_column_if_not_exists('characters', 'active_spec_name', 'VARCHAR(100) NULL');

-- Add active_spec_role field
CALL add_column_if_not_exists('characters', 'active_spec_role', 'VARCHAR(50) NULL');

-- Add is_active field to track if character is still in guild
CALL add_column_if_not_exists('characters', 'is_active', 'BOOLEAN DEFAULT TRUE');

-- Add armory_link field
CALL add_column_if_not_exists('characters', 'armory_link', 'VARCHAR(255) NULL');

-- Add specialization field for detailed spec info
CALL add_column_if_not_exists('characters', 'specialization', 'VARCHAR(100) NULL');

-- Add raid_participation field as JSON
CALL add_column_if_not_exists('characters', 'raid_participation', 'JSON NULL');

-- Convert zero values to NULL for better display
CALL convert_zeros_to_null('characters', 'raider_io_score', 'number');
CALL convert_zeros_to_null('raid_bosses', 'pull_count', 'number');
CALL convert_zeros_to_null('raid_bosses', 'kill_count', 'number');

-- Display success message
SELECT 'Character fields migration completed successfully.' AS 'Migration Status';