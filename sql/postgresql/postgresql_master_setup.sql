-- PostgreSQL Master Setup Script
-- Runs all the necessary scripts to set up a complete PostgreSQL database
-- Compatible with PostgreSQL 12+

-- Create initial schema
\echo 'Creating initial schema...'
\i 01_init_schema.sql

-- Run all migrations in order
\echo 'Running migrations...'
\i migrations/001_add_character_fields.sql

-- Install utility functions
\echo 'Installing utility functions...'
\i utilities/postgres_json_helpers.sql

-- Insert default data
\echo 'Inserting default data...'
\i 02_default_data.sql

-- Display completion message
\echo 'PostgreSQL database setup completed successfully.'

-- NOTE: This script assumes it's run from the postgresql/ directory
-- Run it with: psql -U username -d database_name -f postgresql_master_setup.sql