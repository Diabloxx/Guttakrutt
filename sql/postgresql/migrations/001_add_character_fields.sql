-- PostgreSQL Migration: Add Character Fields
-- Adds new character fields to support Raider.IO integration

-- Add new columns to characters table
ALTER TABLE "characters" 
ADD COLUMN IF NOT EXISTS "realm" TEXT,
ADD COLUMN IF NOT EXISTS "role" TEXT,
ADD COLUMN IF NOT EXISTS "raid_participation" JSONB,
ADD COLUMN IF NOT EXISTS "raider_io_score" INTEGER,
ADD COLUMN IF NOT EXISTS "last_active" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "armory_link" TEXT;