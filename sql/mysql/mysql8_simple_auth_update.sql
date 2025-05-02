-- Simplified authentication update script for MySQL 8+
-- This script avoids IF/THEN syntax which can cause issues in some MySQL versions

-- Check if the users table exists
SELECT COUNT(*) INTO @usersExists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'users';

-- If users table doesn't exist, create it with all required fields
SET @sqlUsers = IF(@usersExists = 0, 
  'CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NULL UNIQUE,
    password TEXT NULL,
    display_name VARCHAR(255) NULL,
    battle_net_id VARCHAR(255) NULL UNIQUE,
    battle_tag VARCHAR(255) NULL DEFAULT "",
    email VARCHAR(255) NULL UNIQUE,
    access_token TEXT NULL,
    refresh_token TEXT NULL,
    token_expiry TIMESTAMP NULL,
    last_login TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_guild_member BOOLEAN DEFAULT FALSE,
    is_officer BOOLEAN DEFAULT FALSE,
    region VARCHAR(10) DEFAULT "eu",
    locale VARCHAR(10) DEFAULT "en_GB",
    avatar_url TEXT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci', 
  'SELECT "Users table already exists, checking for missing columns..." AS message');

PREPARE stmtUsers FROM @sqlUsers;
EXECUTE stmtUsers;
DEALLOCATE PREPARE stmtUsers;

-- Check if the users table exists (after possibly creating it)
SELECT COUNT(*) INTO @usersExists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'users';

-- Check if username column already exists
SELECT COUNT(*) INTO @usernameExists FROM information_schema.columns 
WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'username';

-- Add username column if it doesn't exist
SET @sqlAddUsername = IF(@usernameExists = 0 AND @usersExists > 0, 
  'ALTER TABLE users ADD COLUMN username VARCHAR(255) NULL', 
  'SELECT "Username column check complete" AS message');

PREPARE stmtAddUsername FROM @sqlAddUsername;
EXECUTE stmtAddUsername;
DEALLOCATE PREPARE stmtAddUsername;

-- Check if password column already exists
SELECT COUNT(*) INTO @passwordExists FROM information_schema.columns 
WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'password';

-- Add password column if it doesn't exist
SET @sqlAddPassword = IF(@passwordExists = 0 AND @usersExists > 0, 
  'ALTER TABLE users ADD COLUMN password TEXT NULL', 
  'SELECT "Password column check complete" AS message');

PREPARE stmtAddPassword FROM @sqlAddPassword;
EXECUTE stmtAddPassword;
DEALLOCATE PREPARE stmtAddPassword;

-- Check if display_name column already exists
SELECT COUNT(*) INTO @displayNameExists FROM information_schema.columns 
WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'display_name';

-- Add display_name column if it doesn't exist
SET @sqlAddDisplayName = IF(@displayNameExists = 0 AND @usersExists > 0, 
  'ALTER TABLE users ADD COLUMN display_name VARCHAR(255) NULL', 
  'SELECT "Display_name column check complete" AS message');

PREPARE stmtAddDisplayName FROM @sqlAddDisplayName;
EXECUTE stmtAddDisplayName;
DEALLOCATE PREPARE stmtAddDisplayName;

-- Check if battle_net_id column exists and is NOT NULL
SELECT COUNT(*) INTO @bnIdExists FROM information_schema.columns 
WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'battle_net_id';

SELECT COUNT(*) INTO @bnIdNotNull FROM information_schema.columns 
WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'battle_net_id' AND is_nullable = 'NO';

-- Drop unique constraint if it exists (to modify the column)
SELECT COUNT(*) INTO @bnIdConstraintExists FROM information_schema.table_constraints 
WHERE table_schema = DATABASE() AND table_name = 'users' AND constraint_name = 'users_battle_net_id_unique';

SET @sqlDropBnIdConstraint = IF(@bnIdConstraintExists > 0 AND @usersExists > 0, 
  'ALTER TABLE users DROP CONSTRAINT users_battle_net_id_unique', 
  'SELECT "No constraint to drop" AS message');

PREPARE stmtDropBnIdConstraint FROM @sqlDropBnIdConstraint;
EXECUTE stmtDropBnIdConstraint;
DEALLOCATE PREPARE stmtDropBnIdConstraint;

-- Modify battle_net_id column to be nullable if it exists and is NOT NULL
SET @sqlModifyBnId = IF(@bnIdExists > 0 AND @bnIdNotNull > 0 AND @usersExists > 0, 
  'ALTER TABLE users MODIFY COLUMN battle_net_id VARCHAR(255) NULL', 
  'SELECT "Battle_net_id column check complete" AS message');

PREPARE stmtModifyBnId FROM @sqlModifyBnId;
EXECUTE stmtModifyBnId;
DEALLOCATE PREPARE stmtModifyBnId;

-- Re-add the unique constraint
SELECT COUNT(*) INTO @bnIdNewConstraintExists FROM information_schema.table_constraints 
WHERE table_schema = DATABASE() AND table_name = 'users' AND constraint_name = 'users_battle_net_id_unique';

SET @sqlAddBnIdConstraint = IF(@bnIdExists > 0 AND @bnIdNewConstraintExists = 0 AND @usersExists > 0, 
  'ALTER TABLE users ADD CONSTRAINT users_battle_net_id_unique UNIQUE (battle_net_id)', 
  'SELECT "Battle_net_id constraint check complete" AS message');

PREPARE stmtAddBnIdConstraint FROM @sqlAddBnIdConstraint;
EXECUTE stmtAddBnIdConstraint;
DEALLOCATE PREPARE stmtAddBnIdConstraint;

-- Add unique index on username if it doesn't exist
SELECT COUNT(*) INTO @usernameIndexExists FROM information_schema.statistics 
WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_users_username';

SET @sqlAddUsernameIndex = IF(@usernameExists > 0 AND @usernameIndexExists = 0 AND @usersExists > 0, 
  'CREATE UNIQUE INDEX idx_users_username ON users(username)', 
  'SELECT "Username index check complete" AS message');

PREPARE stmtAddUsernameIndex FROM @sqlAddUsernameIndex;
EXECUTE stmtAddUsernameIndex;
DEALLOCATE PREPARE stmtAddUsernameIndex;

-- Add unique index on email if it doesn't exist
SELECT COUNT(*) INTO @emailExists FROM information_schema.columns 
WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'email';

SELECT COUNT(*) INTO @emailIndexExists FROM information_schema.statistics 
WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_users_email';

SET @sqlAddEmailIndex = IF(@emailExists > 0 AND @emailIndexExists = 0 AND @usersExists > 0, 
  'CREATE UNIQUE INDEX idx_users_email ON users(email)', 
  'SELECT "Email index check complete" AS message');

PREPARE stmtAddEmailIndex FROM @sqlAddEmailIndex;
EXECUTE stmtAddEmailIndex;
DEALLOCATE PREPARE stmtAddEmailIndex;

-- Create the session table if it doesn't exist
SELECT COUNT(*) INTO @sessionTableExists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'sessions';

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

-- Add index for sessions expiration if it doesn't exist
SELECT COUNT(*) INTO @expiredIndexExists FROM information_schema.statistics 
WHERE table_schema = DATABASE() AND table_name = 'sessions' AND index_name = 'sessions_expired_index';

SET @sqlAddExpiredIndex = IF(@sessionTableExists > 0 AND @expiredIndexExists = 0, 
  'CREATE INDEX sessions_expired_index ON sessions(expired)', 
  'SELECT "Sessions expired index check complete" AS message');

PREPARE stmtAddExpiredIndex FROM @sqlAddExpiredIndex;
EXECUTE stmtAddExpiredIndex;
DEALLOCATE PREPARE stmtAddExpiredIndex;

-- Create the user_characters table if it doesn't exist
SELECT COUNT(*) INTO @userCharactersExists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'user_characters';

-- Check if characters table exists (required for foreign key)
SELECT COUNT(*) INTO @charactersExists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'characters';

SET @sqlUserCharacters = IF(@userCharactersExists = 0 AND @charactersExists > 0 AND @usersExists > 0, 
  'CREATE TABLE user_characters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    character_id INT NOT NULL,
    is_main BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_characters_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_characters_character_id FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_character_pairing UNIQUE (user_id, character_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci', 
  'SELECT "User_characters table check complete" AS message');

PREPARE stmtUserCharacters FROM @sqlUserCharacters;
EXECUTE stmtUserCharacters;
DEALLOCATE PREPARE stmtUserCharacters;

-- Add user_id index if it doesn't exist
SELECT COUNT(*) INTO @idxUserIdExists FROM information_schema.statistics 
WHERE table_schema = DATABASE() AND table_name = 'user_characters' AND index_name = 'idx_user_characters_user_id';

SET @sqlIdxUserId = IF(@userCharactersExists > 0 AND @idxUserIdExists = 0, 
  'CREATE INDEX idx_user_characters_user_id ON user_characters(user_id)', 
  'SELECT "User characters user_id index check complete" AS message');

PREPARE stmtIdxUserId FROM @sqlIdxUserId;
EXECUTE stmtIdxUserId;
DEALLOCATE PREPARE stmtIdxUserId;

-- Add character_id index if it doesn't exist
SELECT COUNT(*) INTO @idxCharacterIdExists FROM information_schema.statistics 
WHERE table_schema = DATABASE() AND table_name = 'user_characters' AND index_name = 'idx_user_characters_character_id';

SET @sqlIdxCharacterId = IF(@userCharactersExists > 0 AND @idxCharacterIdExists = 0, 
  'CREATE INDEX idx_user_characters_character_id ON user_characters(character_id)', 
  'SELECT "User characters character_id index check complete" AS message');

PREPARE stmtIdxCharacterId FROM @sqlIdxCharacterId;
EXECUTE stmtIdxCharacterId;
DEALLOCATE PREPARE stmtIdxCharacterId;

SELECT "Authentication database schema update completed successfully" AS message;