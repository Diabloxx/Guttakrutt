-- Migration to add Battle.net authentication tables for MySQL 8+

-- Check if the users table exists, and create it if it doesn't
SELECT COUNT(*) INTO @usersExists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'users';

SET @sqlUsers = IF(@usersExists = 0, 
  'CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    battle_net_id VARCHAR(255) NOT NULL,
    battle_tag VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expiry TIMESTAMP NULL,
    last_login TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_guild_member BOOLEAN DEFAULT FALSE,
    is_officer BOOLEAN DEFAULT FALSE,
    region VARCHAR(10) DEFAULT \"eu\",
    locale VARCHAR(10) DEFAULT \"en_GB\",
    avatar_url TEXT,
    CONSTRAINT users_battle_net_id_unique UNIQUE (battle_net_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci', 
  'SELECT \"Users table already exists\" AS message');

PREPARE stmtUsers FROM @sqlUsers;
EXECUTE stmtUsers;
DEALLOCATE PREPARE stmtUsers;

-- Check if the user_characters table exists, and create it if it doesn't
SELECT COUNT(*) INTO @userCharactersExists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'user_characters';

SET @sqlUserCharacters = IF(@userCharactersExists = 0, 
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
  'SELECT \"User_characters table already exists\" AS message');

PREPARE stmtUserCharacters FROM @sqlUserCharacters;
EXECUTE stmtUserCharacters;
DEALLOCATE PREPARE stmtUserCharacters;

-- Add indexes for faster lookups (only if they don't exist)
SELECT COUNT(*) INTO @idxUserIdExists FROM information_schema.statistics 
WHERE table_schema = DATABASE() AND table_name = 'user_characters' AND index_name = 'idx_user_characters_user_id';

SET @sqlIdxUserId = IF(@idxUserIdExists = 0, 
  'CREATE INDEX idx_user_characters_user_id ON user_characters(user_id)', 
  'SELECT \"Index idx_user_characters_user_id already exists\" AS message');

PREPARE stmtIdxUserId FROM @sqlIdxUserId;
EXECUTE stmtIdxUserId;
DEALLOCATE PREPARE stmtIdxUserId;

SELECT COUNT(*) INTO @idxCharacterIdExists FROM information_schema.statistics 
WHERE table_schema = DATABASE() AND table_name = 'user_characters' AND index_name = 'idx_user_characters_character_id';

SET @sqlIdxCharacterId = IF(@idxCharacterIdExists = 0, 
  'CREATE INDEX idx_user_characters_character_id ON user_characters(character_id)', 
  'SELECT \"Index idx_user_characters_character_id already exists\" AS message');

PREPARE stmtIdxCharacterId FROM @sqlIdxCharacterId;
EXECUTE stmtIdxCharacterId;
DEALLOCATE PREPARE stmtIdxCharacterId;