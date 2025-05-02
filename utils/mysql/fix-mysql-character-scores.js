/**
 * Fix MySQL Character Scores
 * 
 * This script automatically fixes character Raider.IO scores in MySQL databases
 * where decimal values may have been stored and need conversion to integers.
 * 
 * Run this script if character score updates are failing with type mismatch errors
 * or if scores aren't appearing correctly in the UI.
 * 
 * Usage:
 *   node fix-mysql-character-scores.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const mysql = require('mysql2');

console.log('MySQL Character Score Fixer');
console.log('============================');

// Detect MySQL environment variables
const mysqlHost = process.env.MYSQL_HOST || 'localhost';
const mysqlPort = process.env.MYSQL_PORT || 3306;
const mysqlUser = process.env.MYSQL_USER || 'root';
const mysqlPassword = process.env.MYSQL_PASSWORD || '';
const mysqlDatabase = process.env.MYSQL_DATABASE;

// Check if essential env variables are set
if (!mysqlDatabase) {
  console.error('Error: Missing MYSQL_DATABASE environment variable.');
  console.log('Please set the following environment variables:');
  console.log('  - MYSQL_HOST: MySQL server host (default: localhost)');
  console.log('  - MYSQL_PORT: MySQL server port (default: 3306)');
  console.log('  - MYSQL_USER: MySQL username (default: root)');
  console.log('  - MYSQL_PASSWORD: MySQL password');
  console.log('  - MYSQL_DATABASE: MySQL database name (required)');
  process.exit(1);
}

// Create MySQL connection
const connection = mysql.createConnection({
  host: mysqlHost,
  port: mysqlPort,
  user: mysqlUser,
  password: mysqlPassword,
  database: mysqlDatabase,
  multipleStatements: true // Enable multiple statements for running the script
});

console.log(`Connecting to MySQL database ${mysqlDatabase} on ${mysqlHost}:${mysqlPort}...`);

// Read the SQL fix script
const sqlScriptPath = path.join(__dirname, 'sql', 'mysql', 'utilities', 'fix_character_scores.sql');
let sqlScript;

try {
  sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');
} catch (err) {
  console.error('Error reading the SQL fix script:', err);
  process.exit(1);
}

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    process.exit(1);
  }
  
  console.log('Connected to MySQL database successfully.');
  console.log('Running character score fix script...');
  
  // Execute the SQL script
  connection.query(sqlScript, (err, results) => {
    if (err) {
      console.error('Error running character score fix script:', err);
      connection.end();
      process.exit(1);
    }
    
    // Find and display the results table
    let resultsTable = null;
    for (const result of results) {
      if (Array.isArray(result) && result.length > 0 && 'Total Characters' in result[0]) {
        resultsTable = result[0];
        break;
      }
    }
    
    if (resultsTable) {
      console.log('\nResults:');
      console.log(`Total Characters: ${resultsTable['Total Characters']}`);
      console.log(`Problematic Scores Found: ${resultsTable['Problematic Character Scores Found']}`);
      console.log(`Scores Fixed: ${resultsTable['Character Scores Fixed']}`);
    }
    
    console.log('\nCharacter score fix completed successfully!');
    connection.end();
  });
});