-- MySQL 8 Full Setup Script for Guttakrutt Guild Website
-- This script creates all required tables with the correct structure
-- and populates them with initial data.

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS guttakrutt;
USE guttakrutt;

-- Drop tables if they exist (careful with this in production!)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS application_comments;
DROP TABLE IF EXISTS application_notifications;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS raid_bosses;
DROP TABLE IF EXISTS raid_progresses;
DROP TABLE IF EXISTS characters;
DROP TABLE IF EXISTS guilds;
DROP TABLE IF EXISTS admin_users;
DROP TABLE IF EXISTS session;
SET FOREIGN_KEY_CHECKS = 1;

-- Create Guilds table
CREATE TABLE guilds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  realm VARCHAR(255) NOT NULL,
  faction VARCHAR(255) NOT NULL,
  description TEXT,
  member_count INT,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  emblem_url VARCHAR(255),
  server_region VARCHAR(255) DEFAULT 'eu'
);

-- Create Characters table
CREATE TABLE characters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  class_name VARCHAR(255) NOT NULL,
  spec_name VARCHAR(255),
  `rank` INT NOT NULL,
  level INT NOT NULL,
  avatar_url VARCHAR(255),
  item_level INT,
  guild_id INT NOT NULL,
  blizzard_id VARCHAR(255),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Raid Progresses table
CREATE TABLE raid_progresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  bosses INT NOT NULL,
  bosses_defeated INT NOT NULL,
  difficulty VARCHAR(255) NOT NULL,
  guild_id INT NOT NULL,
  world_rank INT,
  region_rank INT,
  realm_rank INT,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Raid Bosses table
CREATE TABLE raid_bosses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  raid_name VARCHAR(255) NOT NULL,
  icon_url VARCHAR(255),
  best_time VARCHAR(255),
  best_parse VARCHAR(255),
  pull_count INT DEFAULT 0,
  defeated BOOLEAN DEFAULT FALSE,
  in_progress BOOLEAN DEFAULT FALSE,
  difficulty VARCHAR(255) DEFAULT 'mythic',
  guild_id INT NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  boss_id VARCHAR(255),
  encounter_id INT,
  warcraftlogs_id VARCHAR(255),
  dps_ranking INT,
  healing_ranking INT,
  tank_ranking INT,
  last_kill_date TIMESTAMP NULL,
  kill_count INT,
  fastest_kill VARCHAR(255),
  report_url VARCHAR(255),
  raider_io_data JSON,
  warcraft_logs_data JSON
);

-- Create Admin Users table
CREATE TABLE admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  last_login TIMESTAMP NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Applications table
CREATE TABLE applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  character_name VARCHAR(255) NOT NULL,
  class_name VARCHAR(255) NOT NULL,
  spec_name VARCHAR(255) NOT NULL,
  realm VARCHAR(255) NOT NULL,
  item_level INT,
  experience TEXT NOT NULL,
  availability TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  why_join TEXT NOT NULL,
  raiders_known TEXT,
  referred_by VARCHAR(255),
  additional_info TEXT,
  logs TEXT,
  status VARCHAR(255) NOT NULL DEFAULT 'pending',
  reviewed_by INT,
  review_notes TEXT,
  review_date TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (reviewed_by) REFERENCES admin_users(id)
);

-- Create Application Notifications table
CREATE TABLE application_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  admin_id INT,
  `read` BOOLEAN NOT NULL DEFAULT FALSE,
  notification_type VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (application_id) REFERENCES applications(id),
  FOREIGN KEY (admin_id) REFERENCES admin_users(id)
);

-- Create Application Comments table
CREATE TABLE application_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  admin_id INT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (application_id) REFERENCES applications(id),
  FOREIGN KEY (admin_id) REFERENCES admin_users(id)
);

-- Create Session table for authentication
CREATE TABLE `session` (
  `sid` VARCHAR(255) NOT NULL PRIMARY KEY,
  `sess` JSON NOT NULL,
  `expire` DATETIME(6) NOT NULL
);
CREATE INDEX session_expire_idx ON session (expire);

-- Insert initial admin user (password is 'admin' - please change in production)
INSERT INTO admin_users (username, password) VALUES 
('admin', 'a1c6e9437f01ef9bda152dfa5dd4a71a34b69d17c0a6bf50adeaea46db2ae6bc9c03a7cceb0e5c84b42f07ea0a6b54deb8a0e4d8bec811f04df75c3320be3df1.12dd99d2a45f8b1a09dba45f90edf98b');

-- Insert guild data
INSERT INTO guilds (id, name, realm, faction, description, member_count, emblem_url, server_region) VALUES 
(1, 'Guttakrutt', 'Tarren Mill', 'horde', '100% Norwegian guild founded in 2022. Main team led by Truedream aims for Cutting Edge, raids Sun/Wed 19:20-23:00. Second team ''Blåmandag'' led by Spritney, more casual, raids Mon 20:00-23:00.', 899, 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_head_orc_01.jpg', 'eu');

-- Insert raid progress data
INSERT INTO raid_progresses (id, name, bosses, bosses_defeated, difficulty, guild_id, world_rank, region_rank, realm_rank) VALUES 
(1, 'Nerub-ar Palace', 8, 7, 'mythic', 1, 1658, 940, 97),
(2, 'Liberation of Undermine', 8, 4, 'mythic', 1, 1420, 830, 96);

-- Insert core team members
-- Note: The full roster contains 893 characters which are fetched from the API
-- We only include a handful of key characters in this setup script
INSERT INTO characters (name, class_name, spec_name, `rank`, level, avatar_url, item_level, guild_id) VALUES 
('Truedream', 'Warrior', 'Protection', 0, 70, 'https://render.worldofwarcraft.com/eu/character/tarren-mill/144/176177296-avatar.jpg', 465, 1),
('Razorbean', 'Druid', 'Restoration', 0, 70, 'https://render.worldofwarcraft.com/eu/character/tarren-mill/219/173142811-avatar.jpg', 462, 1),
('Arandy', 'Paladin', 'Holy', 0, 70, 'https://render.worldofwarcraft.com/eu/character/tarren-mill/1/176177153-avatar.jpg', 464, 1),
('Spritney', 'Warlock', 'Demonology', 0, 70, 'https://render.worldofwarcraft.com/eu/character/tarren-mill/199/176177351-avatar.jpg', 461, 1),
('Nordski', 'Rogue', 'Assassination', 0, 70, 'https://render.worldofwarcraft.com/eu/character/tarren-mill/122/176177786-avatar.jpg', 463, 1),
('Thovald', 'Monk', 'Brewmaster', 1, 70, 'https://render.worldofwarcraft.com/eu/character/tarren-mill/53/175947061-avatar.jpg', 460, 1),
('Mjohund', 'Hunter', 'Beast Mastery', 1, 70, 'https://render.worldofwarcraft.com/eu/character/tarren-mill/212/175947220-avatar.jpg', 459, 1),
('Eldorar', 'Mage', 'Frost', 1, 70, 'https://render.worldofwarcraft.com/eu/character/tarren-mill/169/175947337-avatar.jpg', 458, 1),
('Helsebror', 'Priest', 'Discipline', 1, 70, 'https://render.worldofwarcraft.com/eu/character/tarren-mill/91/175947483-avatar.jpg', 457, 1),
('Nythia', 'Demon Hunter', 'Havoc', 1, 70, 'https://render.worldofwarcraft.com/eu/character/tarren-mill/237/172127341-avatar.jpg', 456, 1);

-- Insert raid bosses for Liberation of Undermine (Current)
INSERT INTO raid_bosses (name, raid_name, icon_url, pull_count, defeated, difficulty, guild_id, boss_id, in_progress) VALUES 
('Sprocketmonger Lockenstock', 'Liberation of Undermine', 'inv_111_raid_achievement_sprocketmongerlocknstock', 24, 1, 'mythic', 1, '1', 0),
('One-Armed Bandit', 'Liberation of Undermine', 'inv_111_raid_achievement_onearmedbandit', 35, 1, 'mythic', 1, '2', 0),
('The Hydrocollector', 'Liberation of Undermine', 'inv_111_raid_achievement_thehydrocollector', 42, 1, 'mythic', 1, '3', 0),
('Vexie Fullthrottle and The Geargrinders', 'Liberation of Undermine', 'inv_111_raid_achievement_vexiefulltrottle', 18, 1, 'mythic', 1, '4', 0),
('Mekkamonster 9000', 'Liberation of Undermine', 'inv_111_raid_achievement_mekkamonster9000', 43, 0, 'mythic', 1, '5', 1),
('Professor Pufflecrank''s Puzzle Cube', 'Liberation of Undermine', 'inv_111_raid_achievement_professorpufflecrank', 12, 0, 'mythic', 1, '6', 0),
('Gogglekaboom the Crafty', 'Liberation of Undermine', 'inv_111_raid_achievement_gogglekaboomthecrafty', 0, 0, 'mythic', 1, '7', 0),
('Golden Emperor Moltron', 'Liberation of Undermine', 'inv_111_raid_achievement_goldenemperormoltron', 0, 0, 'mythic', 1, '8', 0);

-- Insert raid bosses for Nerub-ar Palace (Previous tier)
INSERT INTO raid_bosses (name, raid_name, icon_url, pull_count, defeated, difficulty, guild_id, boss_id, in_progress) VALUES 
('Nerubian Overseer', 'Nerub-ar Palace', 'inv_110_raid_achievement_bossmaurickloa', 21, 1, 'mythic', 1, '1', 0),
('Brood Empress Shoth''kar', 'Nerub-ar Palace', 'inv_110_raid_achievement_bosssennarion', 28, 1, 'mythic', 1, '2', 0),
('Venger the Fallen', 'Nerub-ar Palace', 'inv_110_raid_achievement_bossbernardtheninja', 49, 1, 'mythic', 1, '3', 0),
('The Primal Weaver', 'Nerub-ar Palace', 'inv_110_raid_achievement_bossraszageth', 31, 1, 'mythic', 1, '4', 0),
('Tyr, the Infinite Keeper', 'Nerub-ar Palace', 'inv_110_raid_achievement_bosstyrthelightborn', 56, 1, 'mythic', 1, '5', 0),
('Darkmoth', 'Nerub-ar Palace', 'inv_110_raid_achievement_bosstyrants', 42, 1, 'mythic', 1, '6', 0),
('Harbaron, the Eternal Defiler', 'Nerub-ar Palace', 'inv_110_raid_achievement_bosseclipsion', 73, 1, 'mythic', 1, '7', 0),
('Kil''Jaeden', 'Nerub-ar Palace', 'inv_110_raid_achievement_bosskiljadenwotlk', 68, 0, 'mythic', 1, '8', 0);

-- Important indexes for performance
CREATE INDEX idx_characters_guild_id ON characters(guild_id);
CREATE INDEX idx_raid_progresses_guild_id ON raid_progresses(guild_id);
CREATE INDEX idx_raid_bosses_guild_id ON raid_bosses(guild_id);
CREATE INDEX idx_raid_bosses_raid_difficulty ON raid_bosses(raid_name, difficulty);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_app_notifications_admin ON application_notifications(admin_id, `read`);
CREATE INDEX idx_app_comments_application ON application_comments(application_id);