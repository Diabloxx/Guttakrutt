-- Apply all migrations in sequence
-- This will be executed when the server starts

-- For MySQL 8 compatibility, use the MySQL 8 specific version
-- This avoids the IF NOT EXISTS syntax which is not fully supported in MySQL 8
SOURCE /home/runner/workspace/sql/mysql/migrations/2025_05_02_add_raid_tier_system_mysql8.sql;