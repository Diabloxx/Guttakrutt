/**
 * Database helper functions for cross-database compatibility
 * between PostgreSQL and MySQL
 */

/**
 * Determine which database engine is in use
 * This helper centralizes the logic for detecting database type
 */
export function getDatabaseType(): 'mysql' | 'postgres' {
  const dbType = process.env.DB_TYPE?.toLowerCase() || 'postgres';
  return dbType === 'mysql' ? 'mysql' : 'postgres';
}

/**
 * Helper function for database-specific type casting
 * Converts PostgreSQL-style type casts to the appropriate syntax for each database
 * 
 * @param column The column or expression to cast
 * @param type The type to cast to
 * @returns A database-specific casting expression
 */
export function dbCast(column: string, type: string): string {
  const dbType = getDatabaseType();
  
  if (dbType === 'mysql') {
    // MySQL type casting using CAST or CONVERT functions
    switch (type.toLowerCase()) {
      case 'text':
        return `CAST(${column} AS CHAR)`;
      case 'json':
      case 'jsonb':
        return `CAST(${column} AS JSON)`;
      case 'int':
      case 'integer':
        return `CAST(${column} AS SIGNED)`;
      case 'boolean':
        return `CAST(${column} AS UNSIGNED)`;
      case 'timestamp':
        return `CAST(${column} AS DATETIME)`;
      default:
        return `CAST(${column} AS ${type.toUpperCase()})`;
    }
  } else {
    // PostgreSQL type casting using :: operator
    return `${column}::${type}`;
  }
}

/**
 * Process raw SQL queries to make them compatible with the current database
 * This is useful when you have literal SQL strings that need to work with both databases
 * 
 * @param query The SQL query to process
 * @returns A database-compatible SQL query
 */
export function processSqlQuery(query: string): string {
  const dbType = getDatabaseType();
  
  if (dbType === 'mysql') {
    // Apply basic MySQL syntax conversion without dynamic imports
    // Simple but effective PostgreSQL to MySQL conversion
    
    // Starting with type casting
    let processed = query;
    
    // Replace PostgreSQL-style type casts (::type) with MySQL CAST syntax
    processed = processed.replace(/([^\s:]+)::([a-z_]+)/gi, "CAST($1 AS $2)");
    
    // Replace PostgreSQL-specific NOW() calls with MySQL equivalents
    processed = processed.replace(/NOW\(\)::date/gi, "DATE(NOW())");
    
    // Handle the most common JSON operations
    if (processed.includes('->>') || processed.includes('->')) {
      // Replace column->>'key' with JSON_UNQUOTE(JSON_EXTRACT(column, '$.key'))
      processed = processed.replace(/(\w+)->>'([^']+)'/g, "JSON_UNQUOTE(JSON_EXTRACT($1, '$.$2'))");
      
      // Replace column->'key' with JSON_EXTRACT(column, '$.key')
      processed = processed.replace(/(\w+)->'([^']+)'/g, "JSON_EXTRACT($1, '$.$2')");
    }
    
    return processed;
  }
  
  // For PostgreSQL, return the query unchanged
  return query;
}

/**
 * Safe JSON field accessor for both PostgreSQL and MySQL
 * 
 * @param jsonField The JSON field name
 * @param path The path to the property (e.g., 'user.name')
 * @returns A database-specific JSON extraction expression
 */
export function jsonExtract(jsonField: string, path: string): string {
  const dbType = getDatabaseType();
  const pathParts = path.split('.');
  
  if (dbType === 'mysql') {
    // MySQL JSON_EXTRACT with $ prefix for root
    const mysqlPath = ['$', ...pathParts].join('.');
    return `JSON_EXTRACT(${jsonField}, '${mysqlPath}')`;
  } else {
    // PostgreSQL nested JSON access with -> operators
    // For the last element use ->> to get text output
    let result = jsonField;
    for (let i = 0; i < pathParts.length - 1; i++) {
      result += `->'${pathParts[i]}'`;
    }
    result += `->>'${pathParts[pathParts.length - 1]}'`;
    return result;
  }
}

/**
 * Wrapper for database-specific JSON building
 * 
 * @param keyValues Object with key-value pairs to convert to JSON
 * @returns A database-specific JSON object construction expression
 */
export function jsonBuildObject(keyValues: Record<string, any>): string {
  const dbType = getDatabaseType();
  const entries = Object.entries(keyValues);
  
  if (dbType === 'mysql') {
    // MySQL JSON_OBJECT function
    const args = entries.map(([k, v]) => `'${k}', ${v}`).join(', ');
    return `JSON_OBJECT(${args})`;
  } else {
    // PostgreSQL jsonb_build_object function
    const args = entries.flatMap(([k, v]) => [`'${k}'`, v]).join(', ');
    return `jsonb_build_object(${args})`;
  }
}

/**
 * Helper to wrap column names with appropriate quotes based on DB type
 * 
 * @param columnName The column name to quote
 * @returns Quoted column name for the current database type
 */
export function quoteIdentifier(columnName: string): string {
  const dbType = getDatabaseType();
  
  if (dbType === 'mysql') {
    // MySQL uses backticks
    return `\`${columnName}\``;
  } else {
    // PostgreSQL uses double quotes
    return `"${columnName}"`;
  }
}