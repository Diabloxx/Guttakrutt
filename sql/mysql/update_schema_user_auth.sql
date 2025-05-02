-- Migration to update the users table for username/password authentication in MySQL
-- This script makes Battle.net auth optional and adds username/password fields

-- First check if the users table exists
SELECT COUNT(*) INTO @usersExists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'users';

-- Exit if users table doesn't exist yet (it should be created first with update_schema_auth.sql)
SET @sqlCheckUsers = IF(@usersExists = 0, 
  'SELECT "Error: Users table does not exist. Run update_schema_auth.sql first." AS message', 
  'SELECT "Users table exists, proceeding with updates." AS message');

PREPARE stmtCheckUsers FROM @sqlCheckUsers;
EXECUTE stmtCheckUsers;
DEALLOCATE PREPARE stmtCheckUsers;

-- Exit if users table doesn't exist
IF @usersExists = 0 THEN
  SELECT "Exiting migration as users table does not exist" AS message;
  -- Cannot use SIGNAL in all MySQL versions, so we'll just exit
ELSE
  -- Check if username column already exists (to avoid duplicate operations)
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

  -- Make battle_net_id nullable by checking constraint type and modifying
  -- First check if the column is NOT NULL
  SELECT COUNT(*) INTO @bnIdNotNull FROM information_schema.columns 
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'battle_net_id' AND is_nullable = 'NO';

  -- Check if there's a unique key on battle_net_id
  SELECT COUNT(*) INTO @bnIdUniqueKeyExists FROM information_schema.statistics 
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'battle_net_id' AND non_unique = 0;

  -- Drop the unique key if it exists (we'll add it back after modifying the column)
  SET @sqlDropUniqueKey = IF(@bnIdUniqueKeyExists > 0,
    'ALTER TABLE users DROP INDEX battle_net_id',
    'SELECT "No unique key on battle_net_id to drop" AS message');

  PREPARE stmtDropUniqueKey FROM @sqlDropUniqueKey;
  EXECUTE stmtDropUniqueKey;
  DEALLOCATE PREPARE stmtDropUniqueKey;

  -- Modify the battle_net_id column to be nullable
  SET @sqlModifyBnId = IF(@bnIdNotNull > 0, 
    'ALTER TABLE users MODIFY COLUMN battle_net_id VARCHAR(255) NULL', 
    'SELECT "Battle_net_id column is already nullable" AS message');

  PREPARE stmtModifyBnId FROM @sqlModifyBnId;
  EXECUTE stmtModifyBnId;
  DEALLOCATE PREPARE stmtModifyBnId;

  -- Re-add the unique key
  SET @sqlAddUniqueKey = IF(@bnIdUniqueKeyExists > 0,
    'ALTER TABLE users ADD UNIQUE KEY (battle_net_id)',
    'SELECT "No need to re-add unique key for battle_net_id" AS message');

  PREPARE stmtAddUniqueKey FROM @sqlAddUniqueKey;
  EXECUTE stmtAddUniqueKey;
  DEALLOCATE PREPARE stmtAddUniqueKey;

  -- Add a unique key on the username column
  SELECT COUNT(*) INTO @usernameKeyExists FROM information_schema.statistics 
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'username' AND non_unique = 0;

  SET @sqlAddUsernameKey = IF(@usernameKeyExists = 0, 
    'ALTER TABLE users ADD UNIQUE KEY (username)', 
    'SELECT "Username unique key already exists" AS message');

  PREPARE stmtAddUsernameKey FROM @sqlAddUsernameKey;
  EXECUTE stmtAddUsernameKey;
  DEALLOCATE PREPARE stmtAddUsernameKey;

  -- Add unique key on email for faster lookups
  SELECT COUNT(*) INTO @emailKeyExists FROM information_schema.statistics 
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'email' AND non_unique = 0;

  SET @sqlAddEmailKey = IF(@emailKeyExists = 0, 
    'ALTER TABLE users ADD UNIQUE KEY (email)', 
    'SELECT "Email unique key already exists" AS message');

  PREPARE stmtAddEmailKey FROM @sqlAddEmailKey;
  EXECUTE stmtAddEmailKey;
  DEALLOCATE PREPARE stmtAddEmailKey;

  SELECT "User table updated successfully for username/password authentication" AS message;
END IF;