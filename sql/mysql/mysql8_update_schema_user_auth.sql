-- Migration to update the users table for username/password authentication in MySQL 8+
-- This script makes Battle.net auth optional and adds username/password fields

-- First check if the users table exists
SELECT COUNT(*) INTO @usersExists FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'users';

-- Exit if users table doesn't exist yet (it should be created first with mysql8_update_schema_auth.sql)
SET @sqlCheckUsers = IF(@usersExists = 0, 
  'SELECT "Error: Users table does not exist. Run mysql8_update_schema_auth.sql first." AS message;', 
  'SELECT "Users table exists, proceeding with updates." AS message;');

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

  -- Make battle_net_id nullable by dropping the constraint and adding it back as unique but optional
  -- First, check if there's a unique constraint on battle_net_id
  SELECT COUNT(*) INTO @bnIdConstraintExists FROM information_schema.table_constraints 
  WHERE table_schema = DATABASE() AND table_name = 'users' AND constraint_name = 'users_battle_net_id_unique';

  -- Then check if the column is defined as NOT NULL
  SELECT COUNT(*) INTO @bnIdNotNull FROM information_schema.columns 
  WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'battle_net_id' AND is_nullable = 'NO';

  -- If a unique constraint exists, drop it to modify the column
  SET @sqlDropBnIdConstraint = IF(@bnIdConstraintExists > 0, 
    'ALTER TABLE users DROP CONSTRAINT users_battle_net_id_unique', 
    'SELECT "No unique constraint named users_battle_net_id_unique exists" AS message');

  PREPARE stmtDropBnIdConstraint FROM @sqlDropBnIdConstraint;
  EXECUTE stmtDropBnIdConstraint;
  DEALLOCATE PREPARE stmtDropBnIdConstraint;

  -- Modify the battle_net_id column to be nullable
  SET @sqlModifyBnId = IF(@bnIdNotNull > 0, 
    'ALTER TABLE users MODIFY COLUMN battle_net_id VARCHAR(255) NULL', 
    'SELECT "Battle_net_id column is already nullable" AS message');

  PREPARE stmtModifyBnId FROM @sqlModifyBnId;
  EXECUTE stmtModifyBnId;
  DEALLOCATE PREPARE stmtModifyBnId;

  -- Re-add the unique constraint
  SELECT COUNT(*) INTO @bnIdNewConstraintExists FROM information_schema.table_constraints 
  WHERE table_schema = DATABASE() AND table_name = 'users' AND constraint_name = 'users_battle_net_id_unique';

  SET @sqlAddBnIdConstraint = IF(@bnIdNewConstraintExists = 0, 
    'ALTER TABLE users ADD CONSTRAINT users_battle_net_id_unique UNIQUE (battle_net_id)', 
    'SELECT "Unique constraint for battle_net_id already exists" AS message');

  PREPARE stmtAddBnIdConstraint FROM @sqlAddBnIdConstraint;
  EXECUTE stmtAddBnIdConstraint;
  DEALLOCATE PREPARE stmtAddBnIdConstraint;

  -- Add a unique index on the username column
  SELECT COUNT(*) INTO @usernameIndexExists FROM information_schema.statistics 
  WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_users_username';

  SET @sqlAddUsernameIndex = IF(@usernameIndexExists = 0, 
    'CREATE UNIQUE INDEX idx_users_username ON users(username)', 
    'SELECT "Username index already exists" AS message');

  PREPARE stmtAddUsernameIndex FROM @sqlAddUsernameIndex;
  EXECUTE stmtAddUsernameIndex;
  DEALLOCATE PREPARE stmtAddUsernameIndex;

  -- Add index on email for faster lookups
  SELECT COUNT(*) INTO @emailIndexExists FROM information_schema.statistics 
  WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_users_email';

  SET @sqlAddEmailIndex = IF(@emailIndexExists = 0, 
    'CREATE UNIQUE INDEX idx_users_email ON users(email)', 
    'SELECT "Email index already exists" AS message');

  PREPARE stmtAddEmailIndex FROM @sqlAddEmailIndex;
  EXECUTE stmtAddEmailIndex;
  DEALLOCATE PREPARE stmtAddEmailIndex;

  SELECT "User table updated successfully for username/password authentication" AS message;
END IF;