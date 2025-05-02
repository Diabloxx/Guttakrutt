-- Migration to add Battle.net authentication tables

-- Create users table for Battle.net authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    battle_net_id TEXT NOT NULL UNIQUE,
    battle_tag TEXT NOT NULL,
    email TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expiry TIMESTAMP,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_guild_member BOOLEAN DEFAULT FALSE,
    is_officer BOOLEAN DEFAULT FALSE,
    region TEXT DEFAULT 'eu',
    locale TEXT DEFAULT 'en_GB',
    avatar_url TEXT
);

-- Create user-character relationship table
CREATE TABLE IF NOT EXISTS user_characters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    is_main BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add index for faster lookup of user's characters
CREATE INDEX IF NOT EXISTS idx_user_characters_user_id ON user_characters(user_id);
-- Add index for finding which user owns a character
CREATE INDEX IF NOT EXISTS idx_user_characters_character_id ON user_characters(character_id);
-- Add unique constraint to prevent duplicate user-character pairings
ALTER TABLE user_characters ADD CONSTRAINT unique_user_character_pairing UNIQUE (user_id, character_id);