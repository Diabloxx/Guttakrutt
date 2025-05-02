-- Migration for PostgreSQL to add raid tier management system (Fixed version)
-- Date: 2025-05-02

-- Create expansions table
CREATE TABLE IF NOT EXISTS "expansions" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "short_name" TEXT NOT NULL UNIQUE,
  "release_date" TIMESTAMP NOT NULL,
  "is_active" BOOLEAN DEFAULT TRUE,
  "order" INTEGER NOT NULL,
  "last_updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create raid_tiers table
CREATE TABLE IF NOT EXISTS "raid_tiers" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "short_name" TEXT NOT NULL,
  "expansion_id" INTEGER NOT NULL,
  "release_date" TIMESTAMP NOT NULL,
  "is_current" BOOLEAN DEFAULT FALSE,
  "order" INTEGER NOT NULL,
  "last_updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add tier_id column to raid_progresses
ALTER TABLE "raid_progresses" 
ADD COLUMN IF NOT EXISTS "tier_id" INTEGER;

-- Insert The War Within expansion
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "expansions" WHERE "short_name" = 'TWW') THEN
    INSERT INTO "expansions" ("name", "short_name", "release_date", "is_active", "order") 
    VALUES ('The War Within', 'TWW', '2024-03-01', TRUE, 10);
  END IF;
END
$$;

-- Insert raid tiers for The War Within
DO $$
DECLARE 
  expansion_id INTEGER;
BEGIN
  SELECT id INTO expansion_id FROM expansions WHERE short_name = 'TWW';
  
  IF NOT EXISTS (SELECT 1 FROM "raid_tiers" WHERE "name" = 'Nerub-ar Palace') THEN
    INSERT INTO "raid_tiers" ("name", "short_name", "expansion_id", "release_date", "is_current", "order")
    VALUES ('Nerub-ar Palace', 'Palace', expansion_id, '2024-03-01', FALSE, 1);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM "raid_tiers" WHERE "name" = 'Liberation of Undermine') THEN
    INSERT INTO "raid_tiers" ("name", "short_name", "expansion_id", "release_date", "is_current", "order")
    VALUES ('Liberation of Undermine', 'Undermine', expansion_id, '2024-04-15', TRUE, 2);
  END IF;
END
$$;

-- Update existing raid progresses with tier IDs
UPDATE "raid_progresses"
SET "tier_id" = (SELECT id FROM raid_tiers WHERE name = 'Nerub-ar Palace')
WHERE "name" = 'Nerub-ar Palace' AND ("tier_id" IS NULL OR "tier_id" = 0);

UPDATE "raid_progresses"
SET "tier_id" = (SELECT id FROM raid_tiers WHERE name = 'Liberation of Undermine')
WHERE "name" = 'Liberation of Undermine' AND ("tier_id" IS NULL OR "tier_id" = 0);