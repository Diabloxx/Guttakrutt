-- Migration to add tier_id and boss_order columns to raid_bosses table
ALTER TABLE raid_bosses ADD COLUMN IF NOT EXISTS tier_id INTEGER;
ALTER TABLE raid_bosses ADD COLUMN IF NOT EXISTS boss_order INTEGER DEFAULT 0;