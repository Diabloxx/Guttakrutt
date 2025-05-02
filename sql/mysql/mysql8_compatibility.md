# MySQL 8.0 Compatibility Guide

This document outlines the compatibility considerations for MySQL 8.0 in the Guttakrutt Guild Website application.

## Key MySQL 8.0 Limitations

1. **No `IF NOT EXISTS` for `ALTER TABLE ADD COLUMN`**
   - MySQL 8.0 does not support the `IF NOT EXISTS` clause when adding columns
   - Solution: We use stored procedures to check if columns exist before altering tables

2. **JSON Data Type Differences**
   - MySQL uses `JSON` type while PostgreSQL uses `JSONB`
   - MySQL's JSON functions differ from PostgreSQL's

3. **Default Value Handling**
   - MySQL has different rules for default values compared to PostgreSQL
   - Temporal columns in MySQL can have special handling requirements

## Compatibility Solutions

### 1. Column Addition Helper

The `add_column_if_not_exists` stored procedure allows safely adding columns to tables by first checking if they exist:

```sql
DELIMITER //
CREATE PROCEDURE add_column_if_not_exists(
    IN table_schema_param VARCHAR(255),
    IN table_name_param VARCHAR(255),
    IN column_name_param VARCHAR(255),
    IN column_definition TEXT
)
BEGIN
    DECLARE column_exists INT;
    
    SELECT COUNT(*) INTO column_exists
    FROM information_schema.columns
    WHERE table_schema = table_schema_param
      AND table_name = table_name_param
      AND column_name = column_name_param;
    
    IF column_exists = 0 THEN
        SET @sql = CONCAT('ALTER TABLE `', table_name_param, '` ADD COLUMN `', column_name_param, '` ', column_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;
```

### 2. Safe Insert Helper

For safely inserting data without duplicates when `ON CONFLICT` is not available:

```sql
-- For MySQL 8.0, use INSERT IGNORE instead of PostgreSQL's ON CONFLICT
INSERT IGNORE INTO table_name (column1, column2) VALUES (value1, value2);
```

### 3. Zero Value Converter

MySQL displays 0 values where PostgreSQL would show NULL. We use converters to standardize behavior:

```sql
-- Example usage of the zero value converter
CALL convert_zeros_to_null('raid_bosses', 'pull_count', 'number');
```

## Best Practices

1. **Always Use Stored Procedures** for schema modifications
2. **Check Table/Column Existence** before modifying them
3. **Use `INSERT IGNORE`** instead of PostgreSQL's `ON CONFLICT`
4. **Convert zeros to NULL** where appropriate for consistent display
5. **Use prepared statements** for dynamic SQL operations
6. **Test with MySQL 8.0** specifically before deployment

## MySQL Version Detection

Our application detects the MySQL version and adjusts behavior accordingly:

```javascript
async function isMySql8() {
  const [rows] = await pool.query('SELECT VERSION() as version');
  const version = rows[0].version;
  return version.startsWith('8.');
}
```