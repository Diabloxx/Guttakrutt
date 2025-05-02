/**
 * Database module that provides a unified access to both PostgreSQL and MySQL
 * depending on the configuration.
 */
import { getDbConnection } from './db-connector';
// We no longer need to import processSqlQuery since we implement the conversion directly

// Create a promise for the database connection
export const dbPromise = getDbConnection();

/**
 * Get the Drizzle database instance
 * This function should be awaited to get the actual database instance
 * 
 * @returns The Drizzle database instance
 */
export async function getDb() {
  const connection = await dbPromise;
  return connection.db;
}

/**
 * Process SQL query to make it compatible with the current database
 * This is especially important for raw SQL queries that might contain
 * database-specific syntax.
 * 
 * @param sqlQuery The SQL query to process
 * @returns The processed SQL query
 */
function processDatabaseQuery(sqlQuery: string | object): string | object {
  // Simple function to convert PostgreSQL syntax to MySQL
  function convertSyntax(query: string): string {
    const connection = dbPromise;
    
    // Get database type from the environment variable
    const dbType = process.env.DB_TYPE?.toLowerCase() === 'mysql' ? 'mysql' : 'postgres';
    
    // Only process if it's MySQL
    if (dbType === 'mysql') {
      let processed = query;
      
      // PostgreSQL-style casting (::type) to MySQL CAST syntax
      processed = processed.replace(/([^\s:]+)::([a-z_]+)/gi, "CAST($1 AS $2)");
      
      // PostgreSQL NOW()::date to MySQL DATE(NOW())
      processed = processed.replace(/NOW\(\)::date/gi, "DATE(NOW())");
      
      return processed;
    }
    
    // For PostgreSQL, return as is
    return query;
  }
  
  // If it's a string, process it for PostgreSQL -> MySQL conversion
  if (typeof sqlQuery === 'string') {
    return convertSyntax(sqlQuery);
  }
  
  // If it's a parameterized query object with text and values
  if (typeof sqlQuery === 'object' && sqlQuery !== null && 'text' in sqlQuery && typeof sqlQuery.text === 'string') {
    return {
      ...sqlQuery,
      text: convertSyntax(sqlQuery.text)
    };
  }
  
  // Otherwise return as is
  return sqlQuery;
}

// Pool-like interface for compatibility with existing code
export const pool = {
  query: async (...args: any[]) => {
    const connection = await dbPromise;
    
    // Debug the original query to help identify issues
    if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('::text')) {
      console.log('FOUND PROBLEMATIC QUERY WITH ::text:', args[0]);
    }
    
    // Process the query to make it compatible with the current database
    if (args.length > 0) {
      args[0] = processDatabaseQuery(args[0]);
      
      // Debug the modified query
      if (typeof args[0] === 'string' && (args[0].includes('CAST') || args[0].includes('::text'))) {
        console.log('AFTER PROCESSING:', args[0]);
      }
    }
    
    try {
      // Execute with the appropriate connection
      if (connection.dbType === 'postgres') {
        return connection.pool.query(...args);
      } else {
        return connection.connection.query(...args);
      }
    } catch (error) {
      // Debug errors that might be related to the query
      console.error('DATABASE QUERY ERROR:', error);
      console.error('QUERY WAS:', args[0]);
      throw error;
    }
  },
  end: async () => {
    const connection = await dbPromise;
    if (connection.dbType === 'postgres') {
      await connection.pool.end();
    } else {
      await connection.connection.end();
    }
  }
};