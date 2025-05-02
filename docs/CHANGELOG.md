# Changelog

## v2.6.0 (2025-05-02)

### Major Features
- **Expansion Filtering System**: Added ability to filter raid content by WoW expansion
- **Raid Tier Exploration**: Implemented expansion selector for viewing content from multiple expansions
- **Dynamic Raid History**: Enhanced raid history display with expansion-specific filtering
- **Future-Proof Expansion Support**: Added infrastructure for handling future WoW expansions

### User Interface
- **Expansion Selector**: Added intuitive expansion selection tabs at the top of the raid progress section
- **Current Expansion Indicator**: Clear visual indication of the currently active expansion
- **Responsive Design**: Made expansion selection work seamlessly on mobile and desktop
- **Consistent Styling**: Applied WoW-themed styling to expansion selector elements

### Technical Improvements
- **Dynamic Content Filtering**: Added filtering logic to display raid tiers based on selected expansion
- **State Management**: Improved state management for expansion and raid tier selection
- **Data Organization**: Better organization of raid data by expansion and tier
- **Error Prevention**: Enhanced error handling for missing raid tier data

### Documentation
- **Updated Changelog**: Added comprehensive documentation of new expansion filtering features

## v2.5.0 (2025-05-02)

### Major Features
- **Enhanced Security**: Implemented secure random password generation for admin accounts
- **Cross-Platform Scripting**: Added platform-specific startup scripts for Windows, macOS, and Linux
- **Comprehensive Documentation**: New detailed installation and token management guides
- **API Security**: Improved API key and token management with better documentation
- **SEO Improvements**: Enhanced website discoverability and Google search preview

### Security Enhancements
- **Random Password Generation**: Default admin accounts now use secure random passwords
- **Credential Management**: Added comprehensive token management documentation
- **Example Templates**: Added token.json.example for better developer onboarding
- **Startup Security**: Improved credential handling in startup scripts

### Installation and Setup
- **Windows Support**: Enhanced Windows-specific batch file with improved logging
- **Unix Support**: New shell script for macOS and Linux environments
- **Environment Detection**: Better handling of environment variables across platforms
- **Database Configuration**: Simplified database setup for both PostgreSQL and MySQL
- **Dependency Management**: Improved handling of required dependencies

### Documentation
- **Installation Guide**: Detailed platform-specific installation instructions
- **Token Management**: New comprehensive guide for handling API keys and tokens
- **Security Best Practices**: Enhanced documentation for secure credential handling
- **Cross-Database Support**: Better documentation for MySQL and PostgreSQL compatibility
- **README Updates**: Improved quick start instructions with platform-specific guidance

### Technical Improvements
- **Environment Handling**: Better handling of environment variables across platforms
- **Logging Enhancements**: More comprehensive logging during startup and operation
- **Error Handling**: Improved error recovery during installation and startup
- **Dependency Detection**: Automatic installation of required dependencies

## v1.5.0 (2025-04-24)

### Major Features
- **The War Within Expansion Support**: Updated character level default from 70 to 80 for The War Within
- **Enhanced Bulk API Handling**: Completely redesigned API interaction system for reliability
- **MySQL Compatibility Improvements**: Better handling of decimal-to-integer conversions

### Character Data System
- **Level Updates**: All default level values updated from 70 to 80 across the application
- **Batched Processing**: Character updates now process in batches of 50 with progress indicators
- **Exponential Backoff**: Added exponential backoff strategy for API rate limit handling
- **Improved Error Recovery**: System continues processing even if some character updates fail
- **Background Processing**: Updates start immediately and continue in background
- **Pause Between Batches**: Added delays between batches to respect API limits

### Database Enhancements
- **MySQL Score Handling**: Fixed decimal score conversion to integers in MySQL adapter
- **Zero Value Handling**: Improved handling of MySQL's zero values vs NULL values
- **Column Detection**: Better handling of schema differences between database types
- **Fix Scripts**: Added utility scripts to repair existing decimal scores in MySQL

### API Integration
- **API Rate Limiting**: Improved throttling for Raider.IO and WarcraftLogs APIs
- **More Resilient Connections**: Better handling of temporary API failures
- **Detailed Error Logging**: Enhanced error reporting for API issues

### User Interface
- **Immediate Feedback**: Added real-time progress indicators for bulk operations
- **Consistency**: Ensured consistent display of level 80 characters across all views
- **Role Icons**: Updated role icons with official WoW icons from reliable image sources

### Documentation
- **Reorganized Documentation**: Moved installation instructions to dedicated files
- **Enhanced README**: Created a more visually appealing and informative README
- **API Setup Guide**: Expanded WoW API setup documentation
- **MySQL Guide**: Comprehensive MySQL compatibility documentation

### Technical Improvements
- **TypeScript Enhancements**: Better type safety throughout the application
- **Code Organization**: Improved structure for better maintainability
- **Performance Optimization**: More efficient database queries and API calls
- **Error Handling**: More robust error recovery throughout the application

### Bug Fixes
- **MySQL Decimal Scores**: Fixed issues with decimal scores in MySQL databases
- **Character Refresh Issues**: Fixed bugs in character refresh functionality
- **Database Column Differences**: Resolved compatibility issues between database types
- **API Error Recovery**: Better handling of API outages and rate limiting

## v1.4.0 (2025-03-15)

### Major Features
- **Application Review System**: Enhanced recruitment application review process
- **Multi-Language Support**: Added Norwegian translation throughout the application
- **Admin Panel Redesign**: Modernized admin interface with WoW theming

### Guild Management
- **Member Statistics**: Added detailed guild composition analytics
- **Rank Management**: Enhanced display of guild ranks and permissions
- **Roster Filtering**: Improved filtering options in the member roster

### Raid Progress
- **Multiple Raid Tiers**: Added support for tracking multiple raid tiers
- **Difficulty Options**: Added filtering by raid difficulty
- **Performance Metrics**: Enhanced integration with WarcraftLogs data

### User Interface
- **Mobile Responsiveness**: Improved mobile experience across all pages
- **WoW Theme**: Enhanced styling to better match World of Warcraft aesthetics
- **Accessibility**: Improved contrast and readability throughout the site

### Technical Improvements
- **Automated Updates**: Added scheduled daily data refresh
- **API Optimizations**: Reduced API calls with better caching
- **Database Performance**: Optimized queries for better performance

## v1.3.0 (2025-02-01)

### Major Features
- **Recruitment System**: Added complete recruitment application system
- **WarcraftLogs Integration**: Enhanced raid progress tracking with WarcraftLogs data
- **Boss Progress Details**: Added detailed boss progress tracking

### Guild Management
- **Character Details**: Enhanced character profile information
- **API Integration**: Better integration with Raider.IO for character data
- **Class Coloring**: Added WoW class coloring throughout the interface

### Technical Improvements
- **Database Structure**: Optimized database schema for better performance
- **API Rate Limiting**: Added proper handling of API rate limits
- **Error Handling**: Enhanced error recovery throughout the application

## v1.2.0 (2025-01-10)

### Major Features
- **Admin Panel**: Added comprehensive admin panel for site management
- **MySQL Support**: Added support for MySQL databases
- **Multi-Admin System**: Enhanced admin user management

### Technical Improvements
- **Database Abstraction**: Better ORM integration with Drizzle
- **Security Enhancements**: Improved admin authentication system
- **Performance Optimizations**: Faster page loads and API responses

## v1.1.0 (2024-12-15)

### Major Features
- **Raid Progress Tracking**: Added raid progress display
- **Guild Roster**: Enhanced guild member listing
- **API Integration**: Added integration with Raider.IO

### User Interface
- **Responsive Design**: Mobile-friendly layout
- **WoW Styling**: Enhanced theming matching World of Warcraft

### Technical Improvements
- **Database Structure**: Improved data models
- **API Caching**: Added caching for API responses
- **Error Handling**: Better error messages and recovery

## v1.0.0 (2024-11-20)

### Initial Release
- **Guild Information**: Basic guild profile display
- **Member Listing**: Simple guild member listing
- **Raid Progress**: Basic raid progress tracking
- **PostgreSQL Database**: Initial database implementation
- **Basic Admin Panel**: Simple administration interface