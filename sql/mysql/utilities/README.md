# MySQL Database Utilities

This folder contains utility scripts to help maintain and fix issues with MySQL database installations.

## Available Utilities

### MySQL 8 Column Checker (`mysql8_column_checker.sql`)
- Creates a stored procedure to safely add columns to existing tables without using the `IF NOT EXISTS` syntax
- Compatible with MySQL 8.0 and higher
- Use this utility before running migrations to ensure they will work properly

### MySQL Zero Value Converter (`mysql_zero_value_converter.sql`)
- Converts zero values to NULL for fields where zero shouldn't be displayed in the UI
- Creates a stored procedure to handle conversion across multiple tables and columns
- Useful for fixing display issues for boss progress, scores, and rankings

### MySQL Fix Zero Values (`mysql_fix_zero_values.sql`)
- Runs the zero value converter on all commonly used fields automatically
- Helpful for cleaning up data after imports or migrations

### Fix Character Scores (`fix_character_scores.sql`)
- Fixes issues with character Raider.IO scores in MySQL database
- Converts any decimal scores to proper integer values using ROUND()
- Important for MySQL instances where decimal-to-integer conversions are causing errors
- Use this if character score updates are failing or showing database errors

## How to Use

To run any of these utilities, you can execute them directly through MySQL client:

```bash
mysql -u username -p your_database_name < utilities/filename.sql
```

Or you can run them in MySQL Workbench, phpMyAdmin, or any other MySQL client tool by copying and pasting the script contents.

**Important:** Always backup your database before running utility scripts that modify data.