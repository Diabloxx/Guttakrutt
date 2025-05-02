-- MySQL 8.0 Column Checker Utility
-- This script provides stored procedures to safely add columns to existing tables
-- without using the IF NOT EXISTS clause (which MySQL 8 doesn't support for ALTER TABLE ADD COLUMN)

-- Create the column addition helper procedure
DELIMITER //

-- Drop the procedure if it already exists to allow re-running this script
DROP PROCEDURE IF EXISTS add_column_if_not_exists //

-- Create the stored procedure to add a column if it doesn't exist
CREATE PROCEDURE add_column_if_not_exists(
    IN table_name_param VARCHAR(255),
    IN column_name_param VARCHAR(255),
    IN column_definition TEXT
)
BEGIN
    DECLARE column_exists INT;
    
    -- Check if the column exists
    SELECT COUNT(*) INTO column_exists
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = table_name_param
      AND column_name = column_name_param;
    
    -- Add the column if it doesn't exist
    IF column_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE `', table_name_param, '` ADD COLUMN `', column_name_param, '` ', column_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        
        -- Log the column addition
        SELECT CONCAT('Added column `', column_name_param, '` to table `', table_name_param, '`') AS 'Column Added';
    ELSE
        -- Log that the column already exists
        SELECT CONCAT('Column `', column_name_param, '` already exists in table `', table_name_param, '`') AS 'Column Exists';
    END IF;
END //

-- Create a procedure to convert zero values to NULL for better display compatibility with PostgreSQL
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

DELIMITER ;

-- Usage example:
-- CALL add_column_if_not_exists('characters', 'raider_io_score', 'INT NULL');
-- CALL convert_zeros_to_null('raid_bosses', 'pull_count', 'number');