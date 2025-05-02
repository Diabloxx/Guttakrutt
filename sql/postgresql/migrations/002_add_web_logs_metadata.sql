-- Migration to add metadata column to web_logs table
ALTER TABLE web_logs ADD COLUMN IF NOT EXISTS metadata TEXT;