/**
 * Database connector module that supports both PostgreSQL and MySQL
 * 
 * Environment variables:
 * - DB_TYPE: 'postgres' or 'mysql' (default: postgres)
 * - DATABASE_URL: PostgreSQL connection string (required for postgres)
 * - MYSQL_HOST: MySQL host (default: localhost)
 * - MYSQL_PORT: MySQL port (default: 3306)
 * - MYSQL_USER: MySQL username (default: root)
 * - MYSQL_PASSWORD: MySQL password (default: '')
 * - MYSQL_DATABASE: MySQL database name (required for mysql)
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";
import ws from "ws";
import { createMySQLConnection } from './db-mysql';
import { dbConfig } from './db-config';

// Required for serverless environments
neonConfig.webSocketConstructor = ws;

/**
 * Creates a database connection based on the configured database type
 */
export async function createDbConnection() {
  try {
    if (dbConfig.type === 'mysql') {
      console.log('Using MySQL database connection');
      return await createMysqlConnection();
    } else {
      console.log('Using PostgreSQL database connection');
      return await createPostgresConnection();
    }
  } catch (error) {
    console.error('Error creating database connection:', error);
    throw error;
  }
}

/**
 * Creates a PostgreSQL database connection
 */
function createPostgresConnection() {
  try {
    const { connectionString } = dbConfig as { type: 'postgres', connectionString: string | undefined };
    
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is required for PostgreSQL connection");
    }
    
    console.log('Connecting to PostgreSQL database...');
    const pool = new Pool({ connectionString });
    const db = drizzlePg(pool, { schema });
    
    console.log('PostgreSQL connection established successfully');
    
    return {
      pool,
      db,
      dbType: 'postgres' as const
    };
  } catch (error) {
    console.error('Error connecting to PostgreSQL database:', error);
    throw error;
  }
}

/**
 * Creates a MySQL database connection
 */
async function createMysqlConnection() {
  return await createMySQLConnection();
}

// Manage database connection state
let dbConnection: any = null;

/**
 * Initialize the database connection
 */
export function initDbConnection() {
  dbConnection = createDbConnection();
  return dbConnection;
}

/**
 * Get the database connection
 * If no connection exists, create one
 */
export async function getDbConnection() {
  if (!dbConnection) {
    dbConnection = createDbConnection();
  }
  return dbConnection;
}

/**
 * Check if the current database type is MySQL
 * This helps with conditionally handling database-specific operations
 * 
 * @returns true if MySQL is being used, false for PostgreSQL
 */
export function isMySql(): boolean {
  return dbConfig.type === 'mysql';
}