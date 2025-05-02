# MySQL Compatibility Guide

This document provides an in-depth explanation of the MySQL compatibility features implemented in the Guttakrutt Guild Website application.

## Overview

The application was originally designed for PostgreSQL but has been enhanced with special handling to ensure full compatibility with MySQL databases. This guide explains the key differences and how they've been addressed.

## Key Compatibility Features

### 1. Database Connection Handling

The application detects which database type is being used via the `DB_TYPE` environment variable:

```javascript
// In server/db-config.ts
export const dbConfig = dbType === 'mysql' ? mysqlConfig : postgresConfig;
export const databaseType = dbType;
```

### 2. Driver-Specific Storage Classes

Two storage implementations are provided:
- `DatabaseStorage.ts` - Primary implementation for PostgreSQL
- `DatabaseStorage.mysql.ts` - MySQL-specific implementation with compatibility fixes

The correct implementation is selected at runtime based on the database type.

### 3. Cross-Database Authentication

The application implements multiple authentication methods to ensure compatibility:

```javascript
// Handle multiple authentication strategies
async function getCurrentUser(req: Request) {
  // Try standard Passport.js authentication first
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return req.user;
  }

  // Try session-based authentication for non-Passport environments
  if (req.session?.passport?.user) {
    const userId = req.session.passport.user;
    const user = await req.app.locals.storage.getUser(userId);
    return user || null;
  }

  // Try cookie-based authentication for PHP environments
  const authCookie = req.cookies?.guttakrutt_auth;
  if (authCookie) {
    try {
      const decodedCookie = Buffer.from(authCookie, 'base64').toString();
      const cookieData = JSON.parse(decodedCookie);
      if (cookieData.userId) {
        const user = await req.app.locals.storage.getUser(cookieData.userId);
        return user || null;
      }
    } catch (error) {
      // Cookie parsing failed
    }
  }

  return null;
}
```

### 3. SQL Differences Handling

#### Returning Clause
PostgreSQL supports the `returning()` method after insert/update operations, which MySQL doesn't support. For MySQL, we implement a two-step process:

```javascript
// PostgreSQL way (in DatabaseStorage.ts)
const user = await db
  .insert(users)
  .values(userData)
  .returning();

// MySQL way (in DatabaseStorage.mysql.ts)
// First insert
const result = await db
  .insert(users)
  .values(userData);

// Get the ID of the inserted record
const insertId = result[0].insertId;

// Then retrieve the inserted record
const [user] = await db
  .select()
  .from(users)
  .where(eq(users.id, insertId));
```

#### Raw SQL Queries
For complex queries, we provide MySQL-specific versions using raw SQL that's compatible with MySQL syntax:

```javascript
// MySQL-specific query
const sqlQuery = `
  SELECT 
    id, name, raid_name, icon_url, 
    defeated, in_progress, difficulty, 
    guild_id, last_updated, boss_id
  FROM 
    raid_bosses 
  WHERE 
    difficulty = ?
`;
```

### 4. Data Type Handling

MySQL and PostgreSQL handle certain data types differently:

#### Zero vs. NULL Values
MySQL often stores empty numeric values as `0` instead of `NULL`. We transform these values to maintain consistent UI display:

```javascript
// In DatabaseStorage.mysql.ts
if (key === 'defeated') {
  // Convert 0 to null for defeated status to prevent it from appearing in the UI
  transformed.defeated = boss[key] === 0 ? null : boss[key];
}

// Similar transformations for other numeric fields
else if (key === 'pull_count') transformed.pullCount = boss[key] === 0 ? null : boss[key];
else if (key === 'dps_ranking') transformed.dpsRanking = boss[key] === 0 ? null : boss[key];
// etc.
```

#### JSON Handling
PostgreSQL has native JSON support, while MySQL stores JSON as strings. We handle parsing:

```javascript
else if (key === 'raider_io_data') {
  try {
    transformed.raiderIoData = typeof boss[key] === 'string' ? 
      JSON.parse(boss[key]) : boss[key];
  } catch (e) {
    transformed.raiderIoData = null;
  }
}
```

### 5. Schema Discovery

To handle potential schema differences, we implement a fallback mechanism:

```javascript
try {
  // First attempt with a full query
  return await this.getRaidBossesAdvanced(guildId, raidName, difficulty);
} catch (advancedError) {
  // If the advanced query fails (likely due to missing columns), try a basic query
  return await this.getRaidBossesBasic(guildId, raidName, difficulty);
}
```

### 6. CSS Fixes for MySQL Data Artifacts

Some MySQL data artifacts (like "0" appearing for non-defeated bosses) are addressed with specific CSS:

```css
/* Special class for the boss cards */
.boss-not-defeated-card:before,
.boss-not-defeated-card:after {
  content: none !important;
  display: none !important;
  font-size: 0 !important;
}

/* Direct targeting of the most outer element's potential textNodes */
div:has(> .boss-not-defeated-card) > *:not(.boss-card):not(div):not(span) {
  display: none !important;
  opacity: 0 !important;
  font-size: 0 !important;
  content: none !important;
  color: transparent !important;
  position: absolute !important;
  width: 0 !important;
  height: 0 !important;
}
```

## MySQL Setup Instructions

### Environment Setup

1. Set the database type to MySQL:
   ```
   DB_TYPE=mysql
   ```

2. Configure MySQL connection details:
   ```
   MYSQL_HOST=your_host (default: localhost)
   MYSQL_PORT=your_port (default: 3306)
   MYSQL_USER=your_username
   MYSQL_PASSWORD=your_password
   MYSQL_DATABASE=your_database_name
   ```

### Using the Setup Scripts

For Windows users, we provide two helper scripts:

1. `setup-mysql8-full.bat` - Sets up a complete MySQL 8 environment
2. `start-with-mysql.bat` - Starts the application with MySQL configuration

### Manual MySQL Setup

1. Create the database:
   ```sql
   CREATE DATABASE guttakrutt_guild;
   ```

2. Create a dedicated user with appropriate permissions:
   ```sql
   CREATE USER 'guttakrutt_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON guttakrutt_guild.* TO 'guttakrutt_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. Run the database migration:
   ```
   npm run db:push
   ```

## Battle.net API Integration

Battle.net API integration works differently between MySQL and PostgreSQL environments due to differences in the way tokens and authentication data are stored and processed.

### Token Management

Token handling is platform-specific due to data type differences:

```javascript
// PostgreSQL (uses jsonb for token data)
async function refreshBattleNetToken(userId) {
  // Token refresh for PostgreSQL
  const result = await db.query(
    'UPDATE users SET token_data = jsonb_set(token_data, \'{access_token}\', $1::jsonb) WHERE id = $2 RETURNING *',
    [JSON.stringify(newToken), userId]
  );
  return result.rows[0];
}

// MySQL (uses JSON string for token data)
async function refreshBattleNetToken(userId) {
  // Get existing token data first
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  let tokenData = typeof user.tokenData === 'string' ? JSON.parse(user.tokenData) : user.tokenData || {};
  
  // Update the token
  tokenData.access_token = newToken;
  
  // Store back as string
  await db.update(users)
    .set({ tokenData: JSON.stringify(tokenData) })
    .where(eq(users.id, userId));
    
  return user;
}
```

### Error Handling

Battle.net API errors are platform-agnostic but need special handling:

```javascript
// Enhanced error handling for Battle.net API calls
try {
  // Call the Battle.net API
  const result = await fetchFromBattleNet(endpoint, token);
  return result;
} catch (error) {
  // Check for token expiration (403 Forbidden)
  if (error?.response?.status === 403 || error?.status === 403) {
    // Handle token refresh
    const newToken = await refreshToken(userId);
    if (newToken) {
      // Retry with new token
      return await fetchFromBattleNet(endpoint, newToken);
    } else {
      throw new Error('Authentication expired. Please log in again.');
    }
  }
  
  // Handle network errors consistently
  if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
    throw new Error('Could not connect to Battle.net API. Please check your internet connection.');
  }
  
  // Other errors
  throw error;
}
```

## Troubleshooting MySQL Issues

### Common MySQL-specific Issues

1. **"Error: Unknown column" messages**
   - This usually indicates the schema has changed. Run `npm run db:push` to update the schema.

2. **Performance issues with large datasets**
   - Add appropriate indexes to the MySQL tables:
     ```sql
     ALTER TABLE characters ADD INDEX idx_guild_id (guild_id);
     ALTER TABLE raid_bosses ADD INDEX idx_guild_raid (guild_id, raid_name);
     ```

3. **Character encoding issues**
   - Ensure your MySQL database uses UTF-8:
     ```sql
     ALTER DATABASE guttakrutt_guild CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
     ```
     
4. **Battle.net Authentication Errors**
   - If you receive 403 Forbidden errors when accessing Battle.net API:
     ```sql
     -- Check token expiry in MySQL
     SELECT id, battle_tag, access_token, token_expiry FROM users WHERE id = YOUR_USER_ID;
     
     -- Reset token if needed (forces user to reauthenticate)
     UPDATE users SET access_token = NULL, token_expiry = NULL WHERE id = YOUR_USER_ID;
     ```

### Data Consistency Issues

If you're experiencing data consistency issues between PostgreSQL and MySQL:

1. Check the database storage class implementation for the affected entity
2. Verify the transformation logic correctly handles type differences
3. Look for any direct SQL queries that might need MySQL-specific syntax
4. Ensure JSON fields are properly parsed and stringified

## Advanced MySQL Configuration

For production MySQL deployments, consider these configurations:

```sql
-- Optimize for the application's workload
SET GLOBAL innodb_buffer_pool_size = 1G;
SET GLOBAL max_connections = 200;

-- Enable performance schema for monitoring
SET GLOBAL performance_schema = ON;

-- Set appropriate character set and collation
SET GLOBAL character_set_server = utf8mb4;
SET GLOBAL collation_server = utf8mb4_unicode_ci;
```

## Migrating Between Database Types

To migrate from PostgreSQL to MySQL:

1. Export data from PostgreSQL:
   ```
   pg_dump -U postgres -d guttakrutt_guild > pgdata.sql
   ```

2. Convert the dump file format (may require manual adjustments)

3. Import to MySQL:
   ```
   mysql -u root -p guttakrutt_guild < converted_data.sql
   ```

4. Update your environment settings to use MySQL

To migrate from MySQL to PostgreSQL, reverse the process above.

## Known Limitations

While we've addressed most compatibility issues, be aware of these limitations:

1. Some advanced PostgreSQL-specific queries cannot be directly translated
2. Performance characteristics may differ between database types
3. Schema migrations may require additional attention in MySQL
4. Full-text search features work differently between the two databases