/**
 * This is a utility script to help find PostgreSQL-specific syntax
 * that might be breaking MySQL compatibility
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL-specific patterns to search for
const postgresPatterns = [
  '::text',        // PostgreSQL type casting
  '::json',        // PostgreSQL JSON casting
  '::jsonb',       // PostgreSQL JSONB casting
  '::int',         // PostgreSQL integer casting
  '::boolean',     // PostgreSQL boolean casting
  '::timestamp',   // PostgreSQL timestamp casting
  'json_extract',  // PostgreSQL JSON extraction
  'jsonb_',        // PostgreSQL JSONB functions
  'array_',        // PostgreSQL array functions
  'returning'      // While MySQL 8+ supports it, older versions don't
];

// Directories to search
const directoriesToSearch = [
  'server',
  'shared',
  'client/src'
];

// File extensions to check
const extensionsToCheck = ['.ts', '.js', '.tsx', '.jsx'];

// Function to recursively get all files in a directory
function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      fileList = getAllFiles(filePath, fileList);
    } else if (extensionsToCheck.includes(path.extname(filePath))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Main function to search for PostgreSQL patterns
async function findPostgresSyntax() {
  console.log('Searching for PostgreSQL-specific syntax in your codebase...');
  
  let allFiles = [];
  directoriesToSearch.forEach(dir => {
    if (fs.existsSync(dir)) {
      allFiles = allFiles.concat(getAllFiles(dir));
    }
  });
  
  console.log(`Found ${allFiles.length} TypeScript/JavaScript files to check.`);
  
  const results = {};
  
  // Search each file for PostgreSQL patterns
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    for (const pattern of postgresPatterns) {
      if (content.includes(pattern)) {
        if (!results[file]) {
          results[file] = [];
        }
        
        // Find all line numbers where the pattern appears
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes(pattern)) {
            results[file].push({
              pattern,
              line: index + 1,
              content: line.trim()
            });
          }
        });
      }
    }
  }
  
  // Display results
  console.log('\n--- PostgreSQL Syntax Search Results ---\n');
  
  if (Object.keys(results).length === 0) {
    console.log('✅ No explicit PostgreSQL-specific syntax found in the checked files.');
  } else {
    console.log(`❌ Found PostgreSQL-specific syntax in ${Object.keys(results).length} files:\n`);
    
    for (const file in results) {
      console.log(`File: ${file}`);
      
      results[file].forEach(match => {
        console.log(`  Line ${match.line}: ${match.pattern}`);
        console.log(`    ${match.content}`);
      });
      
      console.log('');
    }
    
    console.log('These PostgreSQL-specific patterns may cause compatibility issues with MySQL.');
    console.log('Consider modifying them to use database-agnostic syntax.');
  }
  
  // Additional check for raw SQL queries
  console.log('\n--- Checking for Raw SQL Queries ---\n');
  
  const rawSqlPatterns = [
    'pool.query(',
    'connection.query(',
    'execute(',
    'executeQuery(',
    'sql`',
    'SQL`'
  ];
  
  const rawSqlResults = {};
  
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    for (const pattern of rawSqlPatterns) {
      if (content.includes(pattern)) {
        if (!rawSqlResults[file]) {
          rawSqlResults[file] = [];
        }
        
        // Find all line numbers where the pattern appears
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes(pattern)) {
            rawSqlResults[file].push({
              pattern,
              line: index + 1,
              content: line.trim()
            });
          }
        });
      }
    }
  }
  
  if (Object.keys(rawSqlResults).length === 0) {
    console.log('✅ No explicit raw SQL queries found in the checked files.');
  } else {
    console.log(`⚠️ Found potential raw SQL queries in ${Object.keys(rawSqlResults).length} files:\n`);
    
    for (const file in rawSqlResults) {
      console.log(`File: ${file}`);
      
      rawSqlResults[file].forEach(match => {
        console.log(`  Line ${match.line}: ${match.pattern}`);
        console.log(`    ${match.content}`);
      });
      
      console.log('');
    }
    
    console.log('These raw SQL queries might contain database-specific syntax.');
    console.log('Review them to ensure they work with both PostgreSQL and MySQL.');
  }
}

// Run the main function
findPostgresSyntax().catch(err => {
  console.error('Error running script:', err);
});