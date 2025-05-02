-- MySQL Zero Value Converter
-- Converts zero values to NULL for better cross-database compatibility
-- MySQL often displays zeros where PostgreSQL shows NULL

DELIMITER //

DROP PROCEDURE IF EXISTS convert_zeros_to_null //

-- Create a procedure to handle zero-to-NULL conversion for multiple datatypes
CREATE PROCEDURE convert_zeros_to_null(
    IN table_name_param VARCHAR(255),
    IN column_name_param VARCHAR(255),
    IN column_type VARCHAR(50)
)
BEGIN
    DECLARE update_sql TEXT;
    
    -- Different types need different handling
    CASE column_type
        WHEN 'number' THEN 
            SET update_sql = CONCAT('UPDATE `', table_name_param, '` SET `', column_name_param, '` = NULL WHERE `', column_name_param, '` = 0');
        WHEN 'datetime' THEN
            SET update_sql = CONCAT('UPDATE `', table_name_param, '` SET `', column_name_param, '` = NULL WHERE `', column_name_param, '` = "0000-00-00 00:00:00"');
        WHEN 'date' THEN
            SET update_sql = CONCAT('UPDATE `', table_name_param, '` SET `', column_name_param, '` = NULL WHERE `', column_name_param, '` = "0000-00-00"');
        WHEN 'string' THEN
            SET update_sql = CONCAT('UPDATE `', table_name_param, '` SET `', column_name_param, '` = NULL WHERE `', column_name_param, '` = ""');
        ELSE
            SET update_sql = CONCAT('UPDATE `', table_name_param, '` SET `', column_name_param, '` = NULL WHERE `', column_name_param, '` = 0');
    END CASE;
    
    -- Execute the update
    PREPARE stmt FROM update_sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Log the update
    SELECT CONCAT('Converted zero values to NULL in `', column_name_param, '` of table `', table_name_param, '`') AS 'Zero Conversion';
END //

-- Create a procedure to convert all numeric zeros in raid_bosses table
CREATE PROCEDURE convert_raid_boss_zeros()
BEGIN
    -- Convert numeric fields
    CALL convert_zeros_to_null('raid_bosses', 'pull_count', 'number');
    CALL convert_zeros_to_null('raid_bosses', 'boss_id', 'number');
    CALL convert_zeros_to_null('raid_bosses', 'encounter_id', 'number');
    CALL convert_zeros_to_null('raid_bosses', 'warcraftlogs_id', 'number');
    CALL convert_zeros_to_null('raid_bosses', 'kill_count', 'number');
    
    -- Convert date fields
    CALL convert_zeros_to_null('raid_bosses', 'last_kill_date', 'datetime');
    
    -- Log completion
    SELECT 'Converted all zero values in raid_bosses table to NULL' AS 'Conversion Complete';
END //

-- Create a procedure to convert all numeric zeros in characters table
CREATE PROCEDURE convert_character_zeros()
BEGIN
    -- Convert numeric fields
    CALL convert_zeros_to_null('characters', 'item_level', 'number');
    CALL convert_zeros_to_null('characters', 'raider_io_score', 'number');
    
    -- Convert string fields
    CALL convert_zeros_to_null('characters', 'realm', 'string');
    CALL convert_zeros_to_null('characters', 'role', 'string');
    CALL convert_zeros_to_null('characters', 'spec_name', 'string');
    
    -- Log completion
    SELECT 'Converted all zero values in characters table to NULL' AS 'Conversion Complete';
END //

DELIMITER ;

-- Usage examples:
-- CALL convert_raid_boss_zeros();
-- CALL convert_character_zeros();