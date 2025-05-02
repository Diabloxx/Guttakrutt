-- MySQL Zero Value Fixer
-- Applies all zero value conversions for better display and PostgreSQL compatibility

-- Load the converter utility if not already loaded
SOURCE utilities/mysql_zero_value_converter.sql;

-- Apply conversions to raid bosses table
SELECT 'Fixing zero values in raid_bosses table...' AS 'Status';
CALL convert_raid_boss_zeros();

-- Apply conversions to characters table
SELECT 'Fixing zero values in characters table...' AS 'Status';
CALL convert_character_zeros();

-- Apply conversions to specific fields in other tables
SELECT 'Fixing zero values in other tables...' AS 'Status';

-- Guild table
CALL convert_zeros_to_null('guilds', 'member_count', 'number');
CALL convert_zeros_to_null('guilds', 'emblem_url', 'string');

-- Raid progress table
CALL convert_zeros_to_null('raid_progresses', 'world_rank', 'number');
CALL convert_zeros_to_null('raid_progresses', 'region_rank', 'number');
CALL convert_zeros_to_null('raid_progresses', 'realm_rank', 'number');

-- Applications table
CALL convert_zeros_to_null('applications', 'review_notes', 'string');
CALL convert_zeros_to_null('applications', 'logs', 'string');
CALL convert_zeros_to_null('applications', 'additional_info', 'string');

-- Display completion message
SELECT 'All zero values have been fixed for optimal display' AS 'Complete';