-- Complete authentication update script for MySQL 8+
-- This combines all the necessary auth changes into one file

-- =====================================================
-- PART 1: USERS TABLE UPDATE
-- =====================================================

-- Check if the users table exists, and create it if it doesn't
SELECT COUNT(*) INTO @usersExists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'users';

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
  'SELECT "Users table already exists, will update it" AS message');

PREPARE stmtUsers FROM @sqlUsers;
EXECUTE stmtUsers;
DEALLOCATE PREPARE stmtUsers;

-- If the users table exists, update it with the new columns
IF @usersExists > 0 THEN
  -- Check if username column already exists
  SELECT COUNT(*) INTO @usernameExists FROM information_schema.columns 
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'username';

  -- Add username column if it doesn't exist
  SET @sqlAddUsername = IF(@usernameExists = 0, 
    'ALTER TABLE users ADD COLUMN username VARCHAR(255) NULL', 
    'SELECT "Username column already exists" AS message');

  PREPARE stmtAddUsername FROM @sqlAddUsername;
  EXECUTE stmtAddUsername;
  DEALLOCATE PREPARE stmtAddUsername;

  -- Check if password column already exists
  SELECT COUNT(*) INTO @passwordExists FROM information_schema.columns 
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'password';

  -- Add password column if it doesn't exist
  SET @sqlAddPassword = IF(@passwordExists = 0, 
    'ALTER TABLE users ADD COLUMN password TEXT NULL', 
    'SELECT "Password column already exists" AS message');

  PREPARE stmtAddPassword FROM @sqlAddPassword;
  EXECUTE stmtAddPassword;
  DEALLOCATE PREPARE stmtAddPassword;

  -- Check if display_name column already exists
  SELECT COUNT(*) INTO @displayNameExists FROM information_schema.columns 
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'display_name';

  -- Add display_name column if it doesn't exist
  SET @sqlAddDisplayName = IF(@displayNameExists = 0, 
    'ALTER TABLE users ADD COLUMN display_name VARCHAR(255) NULL', 
    'SELECT "Display_name column already exists" AS message');

  PREPARE stmtAddDisplayName FROM @sqlAddDisplayName;
  EXECUTE stmtAddDisplayName;
  DEALLOCATE PREPARE stmtAddDisplayName;

  -- Make battle_net_id nullable
  SELECT COUNT(*) INTO @bnIdNotNull FROM information_schema.columns 
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'battle_net_id' AND is_nullable = 'NO';

  SET @sqlModifyBnId = IF(@bnIdNotNull > 0, 
    'ALTER TABLE users MODIFY COLUMN battle_net_id VARCHAR(255) NULL', 
    'SELECT "Battle_net_id column is already nullable" AS message');

  PREPARE stmtModifyBnId FROM @sqlModifyBnId;
  EXECUTE stmtModifyBnId;
  DEALLOCATE PREPARE stmtModifyBnId;

  -- Ensure unique constraints exist for username, email, and battle_net_id
  -- First check username unique constraint
  SELECT COUNT(*) INTO @usernameUniqueExists FROM information_schema.statistics 
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'username' AND non_unique = 0;

  SET @sqlUsernameUnique = IF(@usernameUniqueExists = 0 AND @usernameExists > 0, 
    'ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username)', 
    'SELECT "Username unique constraint already exists or column not added yet" AS message');

  PREPARE stmtUsernameUnique FROM @sqlUsernameUnique;
  EXECUTE stmtUsernameUnique;
  DEALLOCATE PREPARE stmtUsernameUnique;

  -- Check email unique constraint
  SELECT COUNT(*) INTO @emailUniqueExists FROM information_schema.statistics 
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'email' AND non_unique = 0;

  SET @sqlEmailUnique = IF(@emailUniqueExists = 0, 
    'ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email)', 
    'SELECT "Email unique constraint already exists" AS message');

  PREPARE stmtEmailUnique FROM @sqlEmailUnique;
  EXECUTE stmtEmailUnique;
  DEALLOCATE PREPARE stmtEmailUnique;

  -- Check battle_net_id unique constraint
  SELECT COUNT(*) INTO @bnIdUniqueExists FROM information_schema.statistics 
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'battle_net_id' AND non_unique = 0;

  SET @sqlBnIdUnique = IF(@bnIdUniqueExists = 0, 
    'ALTER TABLE users ADD CONSTRAINT users_battle_net_id_unique UNIQUE (battle_net_id)', 
    'SELECT "Battle_net_id unique constraint already exists" AS message');

  PREPARE stmtBnIdUnique FROM @sqlBnIdUnique;
  EXECUTE stmtBnIdUnique;
  DEALLOCATE PREPARE stmtBnIdUnique;
END IF;

-- =====================================================
-- PART 2: USER_CHARACTERS TABLE UPDATE
-- =====================================================

-- Check if the user_characters table exists, and create it if it doesn't
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
  'SELECT "User_characters table already exists or required tables missing" AS message');

PREPARE stmtUserCharacters FROM @sqlUserCharacters;
EXECUTE stmtUserCharacters;
DEALLOCATE PREPARE stmtUserCharacters;

-- Add indexes for faster lookups (if the table exists)
IF @userCharactersExists > 0 THEN
  -- Check user_id index
  SELECT COUNT(*) INTO @idxUserIdExists FROM information_schema.statistics 
  WHERE table_schema = DATABASE() AND table_name = 'user_characters' AND index_name = 'idx_user_characters_user_id';

  SET @sqlIdxUserId = IF(@idxUserIdExists = 0, 
    'CREATE INDEX idx_user_characters_user_id ON user_characters(user_id)', 
    'SELECT "Index idx_user_characters_user_id already exists" AS message');

  PREPARE stmtIdxUserId FROM @sqlIdxUserId;
  EXECUTE stmtIdxUserId;
  DEALLOCATE PREPARE stmtIdxUserId;

  -- Check character_id index
  SELECT COUNT(*) INTO @idxCharacterIdExists FROM information_schema.statistics 
  WHERE table_schema = DATABASE() AND table_name = 'user_characters' AND index_name = 'idx_user_characters_character_id';

  SET @sqlIdxCharacterId = IF(@idxCharacterIdExists = 0, 
    'CREATE INDEX idx_user_characters_character_id ON user_characters(character_id)', 
    'SELECT "Index idx_user_characters_character_id already exists" AS message');

  PREPARE stmtIdxCharacterId FROM @sqlIdxCharacterId;
  EXECUTE stmtIdxCharacterId;
  DEALLOCATE PREPARE stmtIdxCharacterId;
END IF;

-- =====================================================
-- PART 3: SESSIONS TABLE CREATION
-- =====================================================

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
IF @sessionTableExists > 0 THEN
  SELECT COUNT(*) INTO @expiredIndexExists FROM information_schema.statistics 
  WHERE table_schema = DATABASE() AND table_name = 'sessions' AND index_name = 'sessions_expired_index';

  SET @sqlAddExpiredIndex = IF(@expiredIndexExists = 0, 
    'CREATE INDEX sessions_expired_index ON sessions(expired)', 
    'SELECT "Expired index already exists" AS message');

  PREPARE stmtAddExpiredIndex FROM @sqlAddExpiredIndex;
  EXECUTE stmtAddExpiredIndex;
  DEALLOCATE PREPARE stmtAddExpiredIndex;
END IF;

SELECT "Authentication database schema update completed successfully" AS message;