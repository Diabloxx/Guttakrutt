# Guttakrutt Guild Website

<div align="center">
  <img src="./attached_assets/GuttaKrut_transparent_background.png" alt="Guttakrutt Guild Logo" width="300" />
  <h3>World of Warcraft Guild Management Platform</h3>
  <p>A comprehensive solution for "Guttakrutt", providing dynamic raid tracking, performance analytics, and recruitment tools.</p>
</div>

## 🚀 Key Features

### 📊 Real-Time Data Integration
- **API Integrations**: Seamless connections with Blizzard, Raider.IO, and WarcraftLogs APIs
- **Automatic Updates**: Daily data refresh with manual override options
- **Cross-Database Compatibility**: Equal support for PostgreSQL and MySQL

### 🏆 Raid Progress Tracking
- **Current Content Focus**: Liberation of Undermine (4/8 Mythic)
- **Previous Tier Display**: Nerub'ar Palace (7/8 Mythic)
- **Detailed Boss Analytics**: Pull counts, last kill dates, performance metrics
- **Multi-Difficulty Views**: Mythic, Heroic, and Normal progress tracking
- **Performance Metrics**: DPS rankings, healing metrics, and parse percentiles

### 👥 Guild Management
- **Member Roster**: Complete guild membership display with WoW class coloring
- **Character Profiles**: Level 80 character data for The War Within expansion
- **Role Organization**: Tank, Healer, and DPS role identification
- **Score Tracking**: Raider.IO and WarcraftLogs score integration
- **Class Distribution**: Visual analytics of guild composition

### 📝 Recruitment System
- **Application Forms**: Class/spec selection with proper WoW styling
- **Application Review**: Admin workflow for reviewing applications
- **Comment System**: Internal discussion on applicants
- **Status Management**: Pending, Approved, Rejected states with notifications
- **Logs Integration**: WarcraftLogs performance review for applicants

### 🛠️ Admin Features
- **Secure Authentication**: Multi-admin support with role management
- **Content Management**: Complete control of website content
- **Data Control**: Manual data entry and API refresh options
- **Customization**: Icon selection, difficulty settings, visual options
- **User Management**: Admin account creation and management

### 🌐 Internationalization
- **Multi-Language Support**: Full English and Norwegian translations
- **Language Switcher**: Easy toggle between supported languages
- **Content Translation**: Ability to edit all translations from admin panel

### 🎨 WoW-Themed UI/UX
- **Class Coloring**: Authentic WoW class colors throughout the interface
- **Responsive Design**: Mobile-friendly layout across all device sizes
- **Theme Integration**: Visual styling matching World of Warcraft aesthetics
- **Accessibility**: High contrast options for better readability

## 📋 Documentation

- [Installation Guide](./INSTALLATION.md): Complete setup instructions
- [WoW API Setup](./WOW_API_SETUP.md): Guide to configuring Blizzard and WarcraftLogs APIs
- [MySQL Compatibility](./MYSQL_COMPATIBILITY_GUIDE.md): Special notes for MySQL users
- [Admin User Guide](./ADMIN_USER_GUIDE.md): Administration instructions

## 🔧 Quick Start

```bash
# Clone repository
git clone <repository-url>

# Install dependencies
npm install

# Setup environment (see INSTALLATION.md)
cp .env.example .env

# Start development server
npm run dev
```

For complete installation instructions, see [INSTALLATION.md](./INSTALLATION.md).

## 📈 Recent Updates

- Updated character levels to 80 for The War Within expansion
- Enhanced bulk update system with API rate limiting and batching
- Fixed MySQL decimal score conversion to integers
- Implemented exponential backoff for improved API reliability
- Added cross-realm character support

## 📚 Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express
- **Database**: PostgreSQL/MySQL with Drizzle ORM
- **API Integration**: Blizzard API, WarcraftLogs API, Raider.IO API
- **Authentication**: Session-based with custom admin panel
- **Internationalization**: i18next with English and Norwegian support

## 🤝 Community

- **Discord**: Join our guild on Discord: [https://discord.gg/X3Wjdh4HvC](https://discord.gg/X3Wjdh4HvC)
- **In-Game**: Find us on Tarren Mill (EU) as "Guttakrutt"

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Blizzard API](https://develop.battle.net/) for WoW data access
- [Raider.IO API](https://raider.io/api) for guild and character data
- [WarcraftLogs API](https://www.warcraftlogs.com/api/docs) for performance metrics
- [World of Warcraft](https://worldofwarcraft.com/) for game assets and inspiration