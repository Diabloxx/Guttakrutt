/**
 * Apply MySQL schema fixes
 * 
 * This script applies the MySQL schema fix script to resolve issues with missing columns
 * Run this script if you encounter database errors like "Unknown column 'realm' in 'field list'"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createMysqlConnection, isMySql } from './server/db-connector.js';

// Get the directory name using ES module approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMySqlFix() {
  console.log('MySQL Schema Fix Tool');
  
  // Make sure we're using MySQL
  if (!isMySql()) {
    console.log('This script is only for MySQL databases. You are using PostgreSQL.');
    console.log('No changes applied.');
    return;
  }

  try {
    // Connect to the database
    console.log('Connecting to MySQL database...');
    const db = await createMysqlConnection();
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'sql', 'mysql', 'mysql8_schema_fix.sql');
    console.log(`Reading SQL fix file from ${sqlFilePath}`);
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split by delimiter to handle stored procedures
    const sqlStatements = sqlContent.split('DELIMITER //');
    
    // First part contains regular SQL statements
    console.log('Applying initial schema fixes...');
    const initialStatements = sqlStatements[0].split(';').filter(stmt => stmt.trim());
    for (const stmt of initialStatements) {
      try {
        await db.query(stmt);
      } catch (err) {
        console.error(`Error executing statement: ${stmt}`, err);
      }
    }
    
    // Handle the stored procedure part if it exists
    if (sqlStatements.length > 1) {
      console.log('Applying stored procedure...');
      const procParts = sqlStatements[1].split('DELIMITER ;');
      if (procParts.length > 0) {
        const procedureDefinition = procParts[0].trim();
        try {
          await db.query(procedureDefinition);
          console.log('Stored procedure created successfully');
        } catch (err) {
          console.error('Error creating stored procedure:', err);
        }
      }
      
      // Execute remaining statements
      if (procParts.length > 1) {
        console.log('Applying column additions and data inserts...');
        const remainingStatements = procParts[1].split(';').filter(stmt => stmt.trim());
        for (const stmt of remainingStatements) {
          try {
            await db.query(stmt);
          } catch (err) {
            console.error(`Error executing statement: ${stmt}`, err);
          }
        }
      }
    }
    
    console.log('MySQL schema fix applied successfully!');
    console.log('You can now restart your application.');
    
    // Close the connection
    await db.end();
    
  } catch (error) {
    console.error('Error applying MySQL schema fix:', error);
  }
}

// Run the migration
applyMySqlFix();