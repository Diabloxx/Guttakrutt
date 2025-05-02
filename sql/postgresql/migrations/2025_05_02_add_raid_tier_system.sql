-- Migration for PostgreSQL to add raid tier management system
-- Date: 2025-05-02

-- Create expansions table
CREATE TABLE IF NOT EXISTS "expansions" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "short_name" TEXT NOT NULL,
  "release_date" TIMESTAMP NOT NULL,
  "is_active" BOOLEAN DEFAULT TRUE,
  "order" INTEGER NOT NULL,
  "last_updated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create raid_tiers table
CREATE TABLE IF NOT EXISTS "raid_tiers" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
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
INSERT INTO "expansions" ("name", "short_name", "release_date", "is_active", "order") 
VALUES ('The War Within', 'TWW', '2024-03-01', TRUE, 10)
ON CONFLICT ("short_name") DO NOTHING;

-- Insert raid tiers for The War Within
INSERT INTO "raid_tiers" ("name", "short_name", "expansion_id", "release_date", "is_current", "order")
VALUES 
('Nerub-ar Palace', 'Palace', 
  (SELECT id FROM expansions WHERE short_name = 'TWW'), 
  '2024-03-01', FALSE, 1);

INSERT INTO "raid_tiers" ("name", "short_name", "expansion_id", "release_date", "is_current", "order")
VALUES
('Liberation of Undermine', 'Undermine', 
  (SELECT id FROM expansions WHERE short_name = 'TWW'), 
  '2024-04-15', TRUE, 2);

-- Update existing raid progresses with tier IDs
UPDATE "raid_progresses"
SET "tier_id" = (SELECT id FROM raid_tiers WHERE name = 'Nerub-ar Palace')
WHERE "name" = 'Nerub-ar Palace';

UPDATE "raid_progresses"
SET "tier_id" = (SELECT id FROM raid_tiers WHERE name = 'Liberation of Undermine')
WHERE "name" = 'Liberation of Undermine';