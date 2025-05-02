# Guttakrutt Guild Website Database Schema

This document outlines the common database schema used by both MySQL and PostgreSQL versions of the application.

## Tables

### Admin Users
- **Table Name**: `admin_users`
- **Purpose**: Store administrator account information
- **Primary Key**: `id`

### Guilds
- **Table Name**: `guilds`
- **Purpose**: Store guild information
- **Primary Key**: `id`

### Characters
- **Table Name**: `characters`
- **Purpose**: Store guild member character information
- **Primary Key**: `id`
- **Foreign Keys**: `guild_id` (references `guilds.id`)

### Raid Progresses
- **Table Name**: `raid_progresses`
- **Purpose**: Store raid progression data for each guild
- **Primary Key**: `id`
- **Foreign Keys**: `guild_id` (references `guilds.id`)

### Raid Bosses
- **Table Name**: `raid_bosses`
- **Purpose**: Store raid boss information and kill status
- **Primary Key**: `id`
- **Foreign Keys**: `guild_id` (references `guilds.id`)

### Applications
- **Table Name**: `applications`
- **Purpose**: Store guild recruitment applications
- **Primary Key**: `id`

### Application Comments
- **Table Name**: `application_comments`
- **Purpose**: Store comments on guild applications
- **Primary Key**: `id`
- **Foreign Keys**: 
  - `application_id` (references `applications.id`)
  - `admin_id` (references `admin_users.id`)

### Application Notifications
- **Table Name**: `application_notifications`
- **Purpose**: Store notifications for application changes
- **Primary Key**: `id`
- **Foreign Keys**: 
  - `application_id` (references `applications.id`)
  - `admin_id` (references `admin_users.id`)

### Website Content
- **Table Name**: `website_content`
- **Purpose**: Store editable website content
- **Primary Key**: `id`
- **Foreign Keys**: `updated_by` (references `admin_users.id`)

### Media Files
- **Table Name**: `media_files`
- **Purpose**: Store uploaded media files metadata
- **Primary Key**: `id`
- **Foreign Keys**: `uploaded_by` (references `admin_users.id`)

### Website Settings
- **Table Name**: `website_settings`
- **Purpose**: Store website configuration settings
- **Primary Key**: `id`
- **Foreign Keys**: `updated_by` (references `admin_users.id`)

### Translations
- **Table Name**: `translations`
- **Purpose**: Store translation strings for multilingual support
- **Primary Key**: `id`

## Key Differences Between MySQL and PostgreSQL

### Data Types
- PostgreSQL uses `TEXT` for text columns and `JSONB` for JSON data
- MySQL uses `VARCHAR(255)` for indexed text columns and `JSON` for JSON data

### Auto-increment
- PostgreSQL uses `SERIAL` type for auto-increment columns
- MySQL uses `INT AUTO_INCREMENT` for auto-increment columns

### Default Values
- PostgreSQL uses `DEFAULT CURRENT_TIMESTAMP` for timestamps
- MySQL uses same syntax but has different behavior for `NULL` fields

### Constraints
- PostgreSQL uses `ON CONFLICT DO NOTHING` for conflict handling
- MySQL uses `INSERT IGNORE` for similar functionality

## Migration Approach
- PostgreSQL uses `ALTER TABLE ADD COLUMN IF NOT EXISTS`
- MySQL uses stored procedures to check column existence before altering tables