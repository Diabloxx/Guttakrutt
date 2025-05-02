/**
 * Database migration utility
 * 
 * This file provides functionality to apply schema changes to the database
 * It can be used to update the database schema without losing data
 */

import { Pool } from '@neondatabase/serverless';
import * as path from 'path';
import * as fs from 'fs';
import { isMySql } from './db-connector';

/**
 * Apply migrations from the appropriate SQL folder based on database type
 */
export async function applyMigrations(pool: Pool) {
  try {
    const dbType = isMySql() ? 'mysql' : 'postgresql';
    console.log(`Applying migrations for ${dbType}...`);
    
    // Determine the migration file path
    // Different path handling for Windows and Unix
    let projectRoot;
    if (process.platform === 'win32') {
      // Windows - use a direct relative path from current directory
      projectRoot = './';
    } else {
      // Unix - use import.meta.url
      const currentFilePath = new URL(import.meta.url).pathname;
      projectRoot = path.resolve(currentFilePath, '../../');
    }
    
    console.log(`Project root path: ${projectRoot}`);
    
    // Use simple join instead of resolve for cleaner paths
    const migrationFile = path.join(
      projectRoot,
      'sql', 
      dbType, 
      'update_schema.sql'
    );

    // Log the path we're trying to use
    console.log(`Looking for migration file at: ${migrationFile}`);

    // For MySQL, also check for the schema fix file
    const schemaFixFile = path.join(
      projectRoot,
      'sql',
      dbType,
      'mysql8_schema_fix.sql'
    );
    
    // Log schema fix file path too
    if (dbType === 'mysql') {
      console.log(`Looking for MySQL schema fix file at: ${schemaFixFile}`);
    }
    
    // Check if the primary migration file exists
    if (!fs.existsSync(migrationFile)) {
      console.error(`Migration file not found: ${migrationFile}`);
      return;
    }
    
    // Read the migration SQL
    const migrationSql = fs.readFileSync(migrationFile, 'utf8');
    
    // For PostgreSQL, execute the entire script at once
    if (dbType === 'postgresql') {
      console.log(`Executing migration from ${migrationFile}`);
      await pool.query(migrationSql);
    } 
    // For MySQL, split the script and execute each statement separately
    else { 
      console.log(`Executing migration from ${migrationFile}`);
      // Split the SQL script into individual statements
      const statements = migrationSql
        .split(';')
        .filter(stmt => stmt.trim().length > 0);
      
      // Execute each statement
      for (const stmt of statements) {
        try {
          await pool.query(stmt);
        } catch (err) {
          console.error(`Error executing statement: ${stmt}`, err);
          // Continue with other statements
        }
      }
      
      // If the schema fix file exists, also apply it
      if (fs.existsSync(schemaFixFile) && dbType === 'mysql') {
        console.log(`Applying additional schema fixes from ${schemaFixFile}`);
        const fixSql = fs.readFileSync(schemaFixFile, 'utf8');
        
        // MySQL fix file has DELIMITER statements for stored procedures
        // We need to handle them specially
        
        // First apply the basic SQL parts (before DELIMITER)
        const basicPart = fixSql.split('DELIMITER //')[0];
        const basicStatements = basicPart
          .split(';')
          .filter(stmt => stmt.trim().length > 0);
        
        for (const stmt of basicStatements) {
          try {
            await pool.query(stmt);
          } catch (err) {
            console.error(`Error executing schema fix statement: ${stmt}`, err);
            // Continue with other statements
          }
        }
        
        console.log('Basic schema fixes applied');
      }
    }
    
    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Error applying migrations:', error);
    throw error;
  }
}