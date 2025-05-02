# MySQL Troubleshooting Guide

This document provides guidance for resolving common MySQL database issues when running the Guttakrutt Guild Website.

## Table Schema Issues

If you encounter errors like:

```
Error fetching guild roster: Error: Unknown column 'realm' in 'field list'
```

This indicates that your MySQL database is missing required columns or tables that have been added in recent updates.

### Fix Option 1: Run the Basic Fix Script (Most Compatible)

This is the simplest and most widely compatible option:

1. Locate the `sql/mysql/basic_fix.sql` file in your project.
2. Execute this file against your MySQL database:

```bash
mysql -u your_username -p your_database_name < sql/mysql/basic_fix.sql
```

Replace `your_username` and `your_database_name` with your actual MySQL credentials.

This approach uses standard SQL that works with all MySQL versions and doesn't rely on stored procedures or complex features. You can safely ignore any "Duplicate column" errors.

### Fix Option 2: Run the Automated Fix Script

We've provided a NodeJS script that will automatically apply the necessary database changes:

```bash
node apply-mysql-fix.js
```

This script will:
- Connect to your MySQL database using your environment variables
- Apply the schema fixes needed
- Report on the operations performed

### Fix Option 3: Manually Fix the Issues

If neither of the above methods work, you can manually add the missing columns (ignore any errors about duplicate columns):

```sql
ALTER TABLE `characters` ADD COLUMN `realm` TEXT;
ALTER TABLE `characters` ADD COLUMN `role` TEXT;
ALTER TABLE `characters` ADD COLUMN `raid_participation` JSON;
ALTER TABLE `characters` ADD COLUMN `raider_io_score` INT;
ALTER TABLE `characters` ADD COLUMN `last_active` TIMESTAMP NULL;
ALTER TABLE `characters` ADD COLUMN `armory_link` TEXT;
```

These statements may produce "Duplicate column" errors if the columns already exist, which you can safely ignore.

## MySQL vs PostgreSQL Compatibility

The application is designed to work with both MySQL and PostgreSQL databases. There are some key differences between the database engines that our code handles automatically:

1. **Returning Clause**: PostgreSQL supports the `RETURNING` clause in INSERT/UPDATE statements, while MySQL does not.
2. **JSON Handling**: PostgreSQL uses JSONB type while MySQL uses JSON.
3. **Text Types**: MySQL does not have case-insensitive text types like CITEXT.

Our database access layer in `DatabaseStorage.mysql.ts` handles these differences automatically.

## Environment Variables

Make sure your environment variables are correctly set for MySQL:

```
DB_TYPE=mysql
MYSQL_HOST=your_mysql_host
MYSQL_PORT=3306
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=your_mysql_database
```

## Additional Help

If you continue to experience MySQL-related issues:

1. Check the server logs for detailed error messages
2. Make sure your MySQL version is 8.0 or higher
3. Verify that the MySQL user has sufficient privileges
4. Check that the database schema is up to date with the latest changes

For any persistent issues, please reach out to the development team.