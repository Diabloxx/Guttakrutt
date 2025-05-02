/**
 * MySQL database connector module for Drizzle ORM
 */
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '@shared/schema';

export async function createMySQLConnection() {
  console.log('Using MySQL database connection');
  
  // Get environment variables
  const host = process.env.MYSQL_HOST || 'localhost';
  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || '';
  
  console.log(`Connecting to MySQL database at ${host}:${port}...`);
  
  try {
    // Create MySQL connection pool
    const pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    // Test the connection
    await pool.query('SELECT 1');
    console.log('MySQL connection established successfully');
    
    // Create Drizzle ORM instance with the connection
    const db = drizzle(pool, { schema, mode: 'default' });
    
    return { db, pool };
  } catch (error) {
    console.error('Error connecting to MySQL database:', error);
    throw error;
  }
}