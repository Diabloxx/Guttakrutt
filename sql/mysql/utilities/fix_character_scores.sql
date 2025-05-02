-- MySQL character score fixer utility
-- This script will repair Raider.IO scores in the database by ensuring they are properly formatted as integers
-- Use this if you encounter issues with character scores displaying incorrectly or database errors about type mismatch

-- Create a stored procedure to check and fix character scores
DELIMITER //

-- Drop the procedure if it already exists
DROP PROCEDURE IF EXISTS `fix_character_scores`;

-- Create the procedure to fix character scores
CREATE PROCEDURE `fix_character_scores`()
BEGIN
    DECLARE total_characters INT DEFAULT 0;
    DECLARE fixed_characters INT DEFAULT 0;
    DECLARE problematic_characters INT DEFAULT 0;
    
    -- Count total characters
    SELECT COUNT(*) INTO total_characters FROM characters;
    
    -- Count problematic characters (any with decimal point or non-integer values)
    SELECT COUNT(*) INTO problematic_characters 
    FROM characters 
    WHERE raider_io_score IS NOT NULL 
      AND (raider_io_score != FLOOR(raider_io_score) OR raider_io_score != CEILING(raider_io_score));
    
    -- Fix all character scores by rounding them to integers
    UPDATE characters
    SET raider_io_score = ROUND(raider_io_score)
    WHERE raider_io_score IS NOT NULL 
      AND (raider_io_score != FLOOR(raider_io_score) OR raider_io_score != CEILING(raider_io_score));
    
    -- Count fixed characters
    SET fixed_characters = ROW_COUNT();
    
    -- Report results
    SELECT 
        total_characters AS 'Total Characters',
        problematic_characters AS 'Problematic Character Scores Found',
        fixed_characters AS 'Character Scores Fixed';
    
END //

DELIMITER ;

-- Execute the procedure
CALL fix_character_scores();

-- Clean up
DROP PROCEDURE IF EXISTS `fix_character_scores`;

-- Message to confirm execution
SELECT 'Character score fix script completed successfully.' AS 'Status';