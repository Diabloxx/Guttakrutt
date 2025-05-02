-- Migration to add metadata column to web_logs table for MySQL
ALTER TABLE web_logs ADD COLUMN IF NOT EXISTS metadata TEXT;