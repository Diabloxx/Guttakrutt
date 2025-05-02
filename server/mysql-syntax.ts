/**
 * MySQL Syntax Helper
 * 
 * This module provides utilities for MySQL compatibility that don't rely on
 * CommonJS-style imports (require), which can cause issues in ESM environments.
 */

/**
 * Convert PostgreSQL-style SQL to MySQL-compatible SQL
 * 
 * @param sql The PostgreSQL SQL query
 * @returns The MySQL-compatible SQL query
 */
export function convertToMySql(sql: string): string {
  if (!sql) return sql;
  
  // Store original query for debugging
  const originalSql = sql;
  let modified = false;
  
  // SPECIAL CASE HANDLING - connect-pg-simple's createTableIfMissing query
  if (sql.includes('CREATE TABLE IF NOT EXISTS "session"') && sql.includes('(sid character varying')) {
    console.log('DETECTED connect-pg-simple TABLE CREATION QUERY - USING MYSQL VERSION');
    return `CREATE TABLE IF NOT EXISTS \`session\` (
      \`sid\` VARCHAR(255) NOT NULL PRIMARY KEY,
      \`sess\` JSON NOT NULL,
      \`expire\` DATETIME(6) NOT NULL
    )`;
  }
  
  // First, let's handle complex cast expressions
  if (sql.includes('::text') && sql.includes('(')) {
    // Safest approach for complex expressions: remove the cast completely
    let complexCastRegex = /\(([^()]*(?:\([^()]*\)[^()]*)*)\)::text/g;
    sql = sql.replace(complexCastRegex, '($1)');
    
    if (sql !== originalSql) {
      modified = true;
      console.log('Removed complex ::text cast from expression with parentheses');
    }
  }
  
  // Handle simple column::text patterns (most common case)
  const simpleTextCastRegex = /(\b\w+)::text\b/g;
  sql = sql.replace(simpleTextCastRegex, 'CAST($1 AS CHAR)');
  if (sql !== originalSql) modified = true;
  
  // Handle other common type casts
  const typeMappings = [
    { pg: '::json', mysql: ' AS JSON' },
    { pg: '::jsonb', mysql: ' AS JSON' },
    { pg: '::int', mysql: ' AS SIGNED' },
    { pg: '::integer', mysql: ' AS SIGNED' },
    { pg: '::bool', mysql: ' AS UNSIGNED' },
    { pg: '::boolean', mysql: ' AS UNSIGNED' },
    { pg: '::date', mysql: ' AS DATE' },
    { pg: '::timestamp', mysql: ' AS DATETIME' }
  ];
  
  for (const { pg, mysql } of typeMappings) {
    if (sql.includes(pg)) {
      modified = true;
      // First replace patterns like: column::type
      sql = sql.replace(new RegExp(`(\\b\\w+)${pg}\\b`, 'g'), `CAST($1${mysql})`);
      
      // Remove any remaining complex patterns with this type
      sql = sql.replace(new RegExp(`::${pg.substring(2)}\\b`, 'g'), '');
    }
  }
  
  // As a last resort, remove any remaining type casts
  if (sql.includes('::')) {
    modified = true;
    sql = sql.replace(/::\w+/g, '');
    console.warn('WARNING: Removed remaining type casts from SQL query. This might affect results.');
  }
  
  // Handle PostgreSQL JSON operators
  if (sql.includes('->>') || sql.includes('->')) {
    modified = true;
    // Replace column->>'key' with JSON_UNQUOTE(JSON_EXTRACT(column, '$.key'))
    sql = sql.replace(/(\w+)->>'([^']+)'/g, "JSON_UNQUOTE(JSON_EXTRACT($1, '$.$2'))");
    
    // Replace column->'key' with JSON_EXTRACT(column, '$.key')
    sql = sql.replace(/(\w+)->'([^']+)'/g, "JSON_EXTRACT($1, '$.$2')");
  }
  
  // Quote MySQL reserved words
  const mysqlReservedWords = [
    'rank', 'order', 'key', 'group', 'where', 'option', 'read',
    'index', 'join', 'limit', 'values', 'update', 'default'
  ];
  
  for (const word of mysqlReservedWords) {
    // Only replace word when it stands alone (not part of another identifier)
    const regex = new RegExp(`\\b${word}\\b(?!\\s*\\()`, 'gi');
    sql = sql.replace(regex, `\`${word}\``);
  }
  
  // Convert RETURNING to use SELECT LAST_INSERT_ID() pattern
  if (sql.includes('RETURNING') || sql.includes('returning')) {
    console.warn('WARNING: RETURNING clause conversion may be incomplete');
    sql = sql.replace(/\s+RETURNING\s+\*/i, '');
    sql = sql.replace(/\s+RETURNING\s+(\w+)/i, '');
  }
  
  // Log if we made changes
  if (modified) {
    console.log('=== PostgreSQL to MySQL Syntax Conversion ===');
    console.log('Original: ', originalSql);
    console.log('Converted:', sql);
    console.log('===========================================');
  }
  
  return sql;
}