/**
 * MySQL database connector module
 * 
 * Environment variables:
 * - MYSQL_HOST: MySQL host (default: localhost)
 * - MYSQL_PORT: MySQL port (default: 3306)
 * - MYSQL_USER: MySQL username (default: root)
 * - MYSQL_PASSWORD: MySQL password (default: '')
 * - MYSQL_DATABASE: MySQL database name (required)
 */
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

export async function createMySQLConnection() {
  try {
    // Force DB_TYPE to mysql to ensure proper dialect selection
    // This is crucial for environments where ENV vars might not be properly set
    if (process.env.DB_TYPE !== 'mysql') {
      console.warn('DB_TYPE environment variable is not set to "mysql". Forcing MySQL mode.');
      process.env.DB_TYPE = 'mysql';
    }
    
    const host = process.env.MYSQL_HOST || 'localhost';
    const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
    const user = process.env.MYSQL_USER || 'root';
    const password = process.env.MYSQL_PASSWORD || '';
    const database = process.env.MYSQL_DATABASE;
    
    if (!database) {
      throw new Error("MYSQL_DATABASE environment variable is required");
    }
    
    console.log(`Connecting to MySQL database at ${host}:${port}...`);
    
    // Create MySQL connection with extended timeout and custom flags
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      // Increase timeouts to handle longer queries
      connectTimeout: 30000,
      // Explicit MySQL settings
      multipleStatements: true,
      // Convert type casting issues
      // This will help handle the ::text PostgreSQL syntax
      typeCast: function (field, next) {
        if (field.type === 'JSON') {
          const stringValue = field.string();
          return stringValue ? JSON.parse(stringValue) : null;
        }
        return next();
      }
    });
    
    // Run a simple query to verify connection
    await connection.query('SELECT 1 AS mysql_connection_test');
    
    // Create Drizzle ORM instance with MySQL connection
    const db = drizzle(connection, { 
      schema, 
      mode: 'default',
      // Add MySQL-specific options
      logger: true 
    });
    
    console.log("MySQL connection established successfully");
    
    return {
      connection,
      db,
      dbType: 'mysql' as const
    };
  } catch (error) {
    console.error("Error connecting to MySQL database:", error);
    throw error;
  }
}