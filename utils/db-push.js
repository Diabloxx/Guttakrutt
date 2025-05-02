import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for the Neon serverless driver
neonConfig.webSocketConstructor = ws;

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log('Creating tables from schema...');
  
  try {
    // Push the schema to the database
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guilds (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        realm TEXT NOT NULL,
        faction TEXT NOT NULL,
        description TEXT,
        member_count INTEGER,
        last_updated TIMESTAMP DEFAULT NOW(),
        emblem_url TEXT,
        server_region TEXT DEFAULT 'eu'
      );

      CREATE TABLE IF NOT EXISTS characters (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        class_name TEXT NOT NULL,
        spec_name TEXT,
        rank INTEGER NOT NULL,
        level INTEGER NOT NULL,
        avatar_url TEXT,
        item_level INTEGER,
        guild_id INTEGER NOT NULL,
        blizzard_id TEXT,
        last_updated TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS raid_progresses (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        bosses INTEGER NOT NULL,
        bosses_defeated INTEGER NOT NULL,
        difficulty TEXT NOT NULL,
        guild_id INTEGER NOT NULL,
        world_rank INTEGER,
        region_rank INTEGER,
        realm_rank INTEGER,
        last_updated TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS raid_bosses (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        raid_name TEXT NOT NULL,
        icon_url TEXT,
        best_time TEXT,
        best_parse TEXT,
        pull_count INTEGER DEFAULT 0,
        defeated BOOLEAN DEFAULT FALSE,
        difficulty TEXT DEFAULT 'mythic',
        guild_id INTEGER NOT NULL,
        last_updated TIMESTAMP DEFAULT NOW(),
        boss_id TEXT,
        encounter_id INTEGER,
        warcraftlogs_id TEXT,
        dps_ranking INTEGER,
        healing_ranking INTEGER,
        tank_ranking INTEGER,
        last_kill_date TIMESTAMP,
        kill_count INTEGER,
        fastest_kill TEXT,
        report_url TEXT,
        raider_io_data JSONB,
        warcraft_logs_data JSONB
      );
      
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        last_login TIMESTAMP,
        last_updated TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        character_name TEXT NOT NULL,
        class_name TEXT NOT NULL,
        spec_name TEXT NOT NULL,
        realm TEXT NOT NULL,
        item_level INTEGER,
        experience TEXT NOT NULL,
        availability TEXT NOT NULL,
        contact_info TEXT NOT NULL,
        why_join TEXT NOT NULL,
        raiders_known TEXT,
        referred_by TEXT,
        additional_info TEXT,
        logs TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        reviewed_by INTEGER REFERENCES admin_users(id),
        review_notes TEXT,
        review_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS application_notifications (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES applications(id),
        admin_id INTEGER REFERENCES admin_users(id),
        read BOOLEAN NOT NULL DEFAULT FALSE,
        notification_type TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS application_comments (
        id SERIAL PRIMARY KEY,
        application_id INTEGER NOT NULL REFERENCES applications(id),
        admin_id INTEGER NOT NULL REFERENCES admin_users(id),
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    console.log('Schema has been successfully pushed to the database!');
  } catch (error) {
    console.error('Error pushing schema:', error);
  } finally {
    await pool.end();
  }
}

runMigration().catch(console.error);