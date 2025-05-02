/**
 * Test script to verify MySQL score update functionality
 */
const mysql = require('mysql2/promise');

async function testMySQLScoreUpdate() {
  console.log("Testing MySQL character score update functionality...");
  
  // Create connection
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'mysql',
    password: process.env.MYSQL_PASSWORD || 'mysql',
    database: process.env.MYSQL_DATABASE || 'wow_guild_db'
  });
  
  try {
    console.log("Connected to MySQL database");
    
    // 1. Insert a test character with a decimal score
    const insertResult = await connection.execute(
      'INSERT INTO characters (name, class, spec_name, item_level, guild_id, raider_io_score) VALUES (?, ?, ?, ?, ?, ?)',
      ['TestCharacter', 'Warrior', 'Arms', 400, 1, 1234.56]
    );
    
    const characterId = insertResult[0].insertId;
    console.log(`Inserted test character with ID: ${characterId}`);
    
    // 2. Check what was stored
    const [initialRows] = await connection.execute(
      'SELECT * FROM characters WHERE id = ?',
      [characterId]
    );
    
    console.log("Initial character data:", initialRows[0]);
    
    // 3. Update the character with another decimal score
    await connection.execute(
      'UPDATE characters SET raider_io_score = ? WHERE id = ?',
      [987.65, characterId]
    );
    
    // 4. Check the result
    const [updatedRows] = await connection.execute(
      'SELECT * FROM characters WHERE id = ?',
      [characterId]
    );
    
    console.log("Updated character data:", updatedRows[0]);
    
    // 5. Clean up
    await connection.execute(
      'DELETE FROM characters WHERE id = ?',
      [characterId]
    );
    
    console.log("Test completed and test data cleaned up");
    
  } catch (error) {
    console.error("Error during test:", error);
  } finally {
    await connection.end();
  }
}

testMySQLScoreUpdate().catch(console.error);