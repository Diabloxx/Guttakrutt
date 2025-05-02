-- Creates the session store table for Express sessions in MySQL 8+
-- This is required for persistent sessions with username/password authentication

-- Check if the session table exists
SELECT COUNT(*) INTO @sessionTableExists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'sessions';

-- Create the session table if it doesn't exist
SET @sqlCreateSessions = IF(@sessionTableExists = 0, 
  'CREATE TABLE sessions (
    sid VARCHAR(255) NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expired TIMESTAMP(6) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci', 
  'SELECT "Sessions table already exists" AS message');

PREPARE stmtCreateSessions FROM @sqlCreateSessions;
EXECUTE stmtCreateSessions;
DEALLOCATE PREPARE stmtCreateSessions;

-- Add index for faster expiration lookups
SELECT COUNT(*) INTO @expiredIndexExists FROM information_schema.statistics 
WHERE table_schema = DATABASE() AND table_name = 'sessions' AND index_name = 'sessions_expired_index';

SET @sqlAddExpiredIndex = IF(@expiredIndexExists = 0, 
  'CREATE INDEX sessions_expired_index ON sessions(expired)', 
  'SELECT "Expired index already exists" AS message');

PREPARE stmtAddExpiredIndex FROM @sqlAddExpiredIndex;
EXECUTE stmtAddExpiredIndex;
DEALLOCATE PREPARE stmtAddExpiredIndex;