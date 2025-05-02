-- MySQL Default Data Script
-- Initializes the database with default data
-- Compatible with MySQL 8.0+

-- Insert default admin user if none exists (password is 'admin')
INSERT IGNORE INTO `admin_users` (`username`, `password`)
SELECT 'admin', '$2b$10$FvOJfSUZFJR66cOeRQnTp.CF6pdXZ3UKUgwXn9wPR.4epgMMuSY3G'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `admin_users` LIMIT 1);

-- Add default settings
INSERT IGNORE INTO `website_settings` (`key`, `value`, `description`, `type`, `category`)
VALUES 
('site_title', 'Guttakrutt - World of Warcraft Guild', 'Website title', 'string', 'general'),
('primary_color', '#4caf50', 'Primary theme color', 'string', 'appearance'),
('secondary_color', '#2e7d32', 'Secondary theme color', 'string', 'appearance'),
('discord_link', 'https://discord.gg/X3Wjdh4HvC', 'Discord invite link', 'string', 'social'),
('default_language', 'en', 'Default site language', 'string', 'general'),
('recruitment_open', 'true', 'Whether recruitment is open', 'boolean', 'recruitment'),
('hero_title', 'Welcome to Guttakrutt', 'Hero section title', 'string', 'content'),
('hero_subtitle', 'A top Norwegian raiding guild on Tarren Mill', 'Hero section subtitle', 'string', 'content'),
('about_us_title', 'About Us', 'About section title', 'string', 'content'),
('about_us_content', 'Guttakrutt is a Norwegian raiding guild founded in 2022. Our main team led by Truedream aims for Cutting Edge and raids Sun/Wed 19:20-23:00. Our second team "Blåmandag" is led by Spritney and raids on Mondays 20:00-23:00.', 'About section content', 'string', 'content'),
('enable_applications', 'true', 'Enable application submissions', 'boolean', 'recruitment');

-- Insert common translation strings
INSERT IGNORE INTO `translations` (`key`, `en_text`, `no_text`, `context`)
VALUES
('nav.home', 'Home', 'Hjem', 'Navigation menu'),
('nav.roster', 'Guild Roster', 'Guildrosteret', 'Navigation menu'),
('nav.progress', 'Progress', 'Fremgang', 'Navigation menu'),
('nav.join', 'Join Us', 'Bli med', 'Navigation menu'),
('header.welcome', 'Welcome to Guttakrutt', 'Velkommen til Guttakrutt', 'Hero section heading'),
('button.apply', 'Apply Now', 'Søk nå', 'Recruitment button'),
('roster.title', 'Guild Roster', 'Guildrosteret', 'Roster page title'),
('roster.search', 'Search members...', 'Søk medlemmer...', 'Roster search placeholder'),
('progress.title', 'Raid Progress', 'Raid Fremgang', 'Progress page title'),
('join.title', 'Join Our Guild', 'Bli med i guilden vår', 'Recruitment page title'),
('join.description', 'Interested in joining Guttakrutt? Fill out the application form below.', 'Interessert i å bli med i Guttakrutt? Fyll ut søknadsskjemaet nedenfor.', 'Recruitment page description'),
('form.submit', 'Submit Application', 'Send Søknad', 'Form submit button'),
('form.character', 'Character Name', 'Karakternavn', 'Application form field'),
('form.class', 'Class', 'Klasse', 'Application form field'),
('form.spec', 'Specialization', 'Spesialisering', 'Application form field'),
('error.required', 'This field is required', 'Dette feltet er påkrevd', 'Form validation error'),
('admin.dashboard', 'Admin Dashboard', 'Admin Kontrollpanel', 'Admin dashboard title'),
('admin.applications', 'Applications', 'Søknader', 'Admin applications tab'),
('admin.roster', 'Guild Roster', 'Guildrosteret', 'Admin roster tab'),
('admin.settings', 'Settings', 'Innstillinger', 'Admin settings tab'),
('admin.logout', 'Logout', 'Logg ut', 'Admin logout button');