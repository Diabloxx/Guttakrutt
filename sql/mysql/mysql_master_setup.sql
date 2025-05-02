-- MySQL Master Setup Script
-- Runs all the necessary scripts to set up a complete MySQL database
-- Compatible with MySQL 8.0+

-- Create initial schema
SOURCE 01_init_schema.sql;

-- Load the utility for handling schema migrations
SOURCE utilities/mysql8_column_checker.sql;

-- Run all migrations in order
SOURCE migrations/001_add_character_fields.sql;

-- Insert default data
SOURCE 02_default_data.sql;

-- Fix zero value display issues
SOURCE utilities/mysql_fix_zero_values.sql;

-- Display completion message
SELECT 'MySQL database setup completed successfully.' AS 'Setup Status';

-- NOTE: This script assumes it's run from the mysql/ directory
-- Run it with: mysql -u username -p database_name < mysql_master_setup.sql