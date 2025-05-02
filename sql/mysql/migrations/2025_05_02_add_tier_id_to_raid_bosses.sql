-- Migration to add tier_id and boss_order columns to raid_bosses table
ALTER TABLE raid_bosses ADD COLUMN tier_id INT;
ALTER TABLE raid_bosses ADD COLUMN boss_order INT DEFAULT 0;