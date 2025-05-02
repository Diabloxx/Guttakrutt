# Guttakrutt Guild Website

<div align="center">
  <img src="./attached_assets/GuttaKrut_transparent_background.png" alt="Guttakrutt Guild Logo" width="300" />
  <h2>World of Warcraft Guild Management Platform</h2>
  <p>A comprehensive solution for "Guttakrutt", providing dynamic raid tracking, performance analytics, and recruitment tools.</p>

  <div>
    <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge" alt="Status Active" />
    <img src="https://img.shields.io/badge/Progress-4%2F8M-blue?style=for-the-badge" alt="Raid Progress" />
    <img src="https://img.shields.io/badge/Guild-Tarren%20Mill%20EU-red?style=for-the-badge" alt="Server" />
    <img src="https://img.shields.io/badge/Expansion-The%20War%20Within-purple?style=for-the-badge" alt="Expansion" />
  </div>
  <br/>
  <a href="https://guttakrutt.org/" target="_blank">
    <img src="https://img.shields.io/badge/Visit%20Live%20Site-4c1?style=for-the-badge&logo=world&logoColor=white" alt="Visit Site" />
  </a>
  <a href="https://discord.gg/X3Wjdh4HvC" target="_blank">
    <img src="https://img.shields.io/badge/Join%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord" />
  </a>
</div>

---

## 📝 Overview

The Guttakrutt Guild Website serves as the official platform for the 100% Norwegian World of Warcraft raiding guild "Guttakrutt" on Tarren Mill (EU). This full-featured management system enables the guild to track raid progression, manage roster, handle recruitment, and showcase achievements, all within a WoW-themed interface that supports both English and Norwegian languages.

The application integrates with Blizzard, Raider.IO, and WarcraftLogs APIs to provide real-time data on guild performance, character stats, and raid progress. It features cross-database compatibility for flexible deployment options and a comprehensive admin panel for complete site management.

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

- [Installation Guide](./docs/INSTALLATION_GUIDE.md): Complete platform-specific setup instructions
- [WoW API Setup](./docs/WOW_API_SETUP.md): Guide to configuring Blizzard and WarcraftLogs APIs
- [MySQL Compatibility](./docs/MYSQL_COMPATIBILITY_GUIDE.md): Special notes for MySQL users
- [Sensitive Data Guide](./docs/SENSITIVE_DATA_GUIDE.md): Security guidelines for API keys and secrets
- [Token Management](./docs/TOKEN_MANAGEMENT.md): How authentication tokens are handled
- [Changelog](./docs/CHANGELOG.md): Version history and recent updates

## 🔧 Quick Start

```bash
# Clone repository
git clone <repository-url>

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your API keys and database configuration
```

### Running the Application

#### Windows
Run the included batch file:
```cmd
start-dev-windows.bat
```
Make sure to edit the batch file with your API keys and database configuration before running.

#### macOS/Linux
Run the included shell script:
```bash
# Make the script executable
chmod +x start-dev-unix.sh

# Run the script
./start-dev-unix.sh
```

#### Using npm
Alternatively, on any platform:
```bash
npm run dev
```

### API Keys Setup

For the application to work properly, you'll need to obtain and configure the following API keys:

1. **Blizzard API**: Register at [Blizzard Developer Portal](https://develop.battle.net/)
   - Add `BLIZZARD_CLIENT_ID` and `BLIZZARD_CLIENT_SECRET` to your .env file

2. **WarcraftLogs API**: Create a client at [WarcraftLogs API Clients](https://www.warcraftlogs.com/api/clients/)
   - Add `WARCRAFTLOGS_CLIENT_ID` and `WARCRAFTLOGS_CLIENT_SECRET` to your .env file

3. **Raider.IO API**: Basic access is available without authentication
   - For advanced features, request an API key and add `RAIDER_IO_API_KEY` to your .env file

For complete and detailed installation instructions, see our comprehensive [Installation Guide](./docs/INSTALLATION_GUIDE.md).

## 📈 Recent Updates

<table>
  <tr>
    <td>
      <ul>
        <li>✨ Updated character levels to 80 for The War Within expansion</li>
        <li>⚡ Enhanced bulk update system with API rate limiting and batching</li>
        <li>🐛 Fixed MySQL decimal score conversion to integers</li>
        <li>🔄 Implemented exponential backoff for improved API reliability</li>
        <li>🔗 Added cross-realm character support</li>
        <li>🛡️ Added WoW-themed easter eggs for scan detection</li>
        <li>🔍 Improved SEO with enhanced schema markup</li>
        <li>📱 Enhanced mobile experience with persistent login/profile button</li>
        <li>🔒 Fixed guild membership verification system</li>
      </ul>
    </td>
    <td>
      <img src="https://img.shields.io/badge/Latest%20Update-May%202025-informational?style=flat-square&logo=github" alt="Latest Update" />
      <br/><br/>
      <img src="https://img.shields.io/badge/Status-Stable-success?style=flat-square" alt="Status" />
      <br/><br/>
      <img src="https://img.shields.io/badge/Version-2.5.0-blue?style=flat-square" alt="Version" />
    </td>
  </tr>
</table>

## 📊 Project Statistics

<table>
  <tr>
    <td>
      <img src="https://img.shields.io/badge/Characters%20Tracked-936-blue?style=flat-square" alt="Characters" />
      <br/><br/>
      <img src="https://img.shields.io/badge/API%20Calls%20(daily)-1.2K-orange?style=flat-square" alt="API Calls" />
      <br/><br/>
      <img src="https://img.shields.io/badge/Current%20Milestone-4%2F8M-yellow?style=flat-square" alt="Milestone" />
    </td>
    <td>
      <img src="https://img.shields.io/badge/Database-PostgreSQL%20%2F%20MySQL-9cf?style=flat-square&logo=postgresql" alt="Database" />
      <br/><br/>
      <img src="https://img.shields.io/badge/Languages-2-ff69b4?style=flat-square" alt="Languages" />
      <br/><br/>
      <img src="https://img.shields.io/badge/UI%20Components-50+-blueviolet?style=flat-square" alt="UI Components" />
    </td>
  </tr>
</table>

## 📚 Tech Stack

<table>
  <tr>
    <th>Category</th>
    <th>Technologies</th>
  </tr>
  <tr>
    <td><b>Frontend</b></td>
    <td>
      <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
      <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
      <img src="https://img.shields.io/badge/TailwindCSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
      <img src="https://img.shields.io/badge/shadcn%2Fui-000000?style=flat-square&logo=shadcnui&logoColor=white" alt="shadcn/ui" />
    </td>
  </tr>
  <tr>
    <td><b>Backend</b></td>
    <td>
      <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
      <img src="https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
      <img src="https://img.shields.io/badge/Drizzle%20ORM-000000?style=flat-square" alt="Drizzle ORM" />
    </td>
  </tr>
  <tr>
    <td><b>Database</b></td>
    <td>
      <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
      <img src="https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL" />
    </td>
  </tr>
  <tr>
    <td><b>APIs</b></td>
    <td>
      <img src="https://img.shields.io/badge/Battle.net%20API-148EFF?style=flat-square&logo=battle.net&logoColor=white" alt="Battle.net API" />
      <img src="https://img.shields.io/badge/WarcraftLogs%20API-FF4500?style=flat-square&logo=warcraft&logoColor=white" alt="WarcraftLogs API" />
      <img src="https://img.shields.io/badge/Raider.IO%20API-00BFFF?style=flat-square&logo=raiderio&logoColor=white" alt="Raider.IO API" />
    </td>
  </tr>
  <tr>
    <td><b>Other</b></td>
    <td>
      <img src="https://img.shields.io/badge/i18next-26A69A?style=flat-square&logo=i18next&logoColor=white" alt="i18next" />
      <img src="https://img.shields.io/badge/Custom%20Auth-000000?style=flat-square" alt="Custom Auth" />
    </td>
  </tr>
</table>

## 🤝 Community & Contributing

<table>
  <tr>
    <td>
      <a href="https://discord.gg/X3Wjdh4HvC" target="_blank">
        <img src="https://img.shields.io/badge/Discord-Join%20Server-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord" />
      </a>
    </td>
    <td>
      Join our active community on Discord for:
      <ul>
        <li>Raid announcements and signups</li>
        <li>Website feature discussions</li>
        <li>Guild recruitment inquiries</li>
        <li>Community events and socials</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td>
      <img src="https://img.shields.io/badge/In--Game-Guttakrutt-C41F3B?style=for-the-badge&logo=world-of-warcraft&logoColor=white" alt="In-Game" />
    </td>
    <td>
      Find us on <b>Tarren Mill (EU)</b> server as <b>"Guttakrutt"</b>
      <ul>
        <li>Main team: <b>Truedream</b> raids Wed/Thu/Mon 19:30-23:00</li>
        <li>Second team: <b>Blåmandag</b> raids Sun/Tue 19:30-23:00</li>
        <li>100% Norwegian guild community</li>
      </ul>
    </td>
  </tr>
</table>

### Contributing to the Project

We welcome contributions from the community! Here's how to get started:

1. **Fork the Repository**: Create your own copy of the project
2. **Create a Feature Branch**: `git checkout -b feature/your-feature-name`
3. **Setup API Keys**: Use .env.example as a template and obtain your own API keys
4. **Make Changes**: Implement your feature or fix following our code style
5. **Test Thoroughly**: Ensure your changes work with both PostgreSQL and MySQL
6. **Submit a Pull Request**: Create a PR with a clear description of your changes

#### Security Guidelines

For detailed security best practices, see our [Sensitive Data Guide](./docs/SENSITIVE_DATA_GUIDE.md).

Key points:
- **Never commit API keys** or sensitive credentials to the repository
- Use the provided `.env.example` file as a template for your local setup
- If needed, create a `token.json` file using the `token.json.example` template
- Keep `token.json` and other credential files in your `.gitignore`
- For testing, use your own WoW API keys from Battle.net, WarcraftLogs, and Raider.IO
- Regularly rotate credentials and monitor access logs
- Follow the principle of least privilege for API and database access

## 🔍 Environment Configuration

Create a `.env` file in the root directory with the following structure:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
# Or for MySQL: DATABASE_URL=mysql://user:password@host:port/database

# Battle.net API
BLIZZARD_CLIENT_ID=your_blizzard_client_id
BLIZZARD_CLIENT_SECRET=your_blizzard_client_secret

# WarcraftLogs API 
WARCRAFTLOGS_CLIENT_ID=your_warcraftlogs_client_id
WARCRAFTLOGS_CLIENT_SECRET=your_warcraftlogs_client_secret

# Raider.IO API (optional for advanced features)
RAIDER_IO_API_KEY=your_raiderio_api_key

# Session Configuration
SESSION_SECRET=a_strong_random_secret_key
```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

<table>
  <tr>
    <td align="center">
      <a href="https://develop.battle.net/">
        <img src="https://img.shields.io/badge/Blizzard%20API-002650?style=for-the-badge&logo=battle.net&logoColor=white" alt="Blizzard API" /><br />
        WoW Data Access
      </a>
    </td>
    <td align="center">
      <a href="https://raider.io/api">
        <img src="https://img.shields.io/badge/Raider.IO%20API-00BFFF?style=for-the-badge&logo=raiderio&logoColor=white" alt="Raider.IO API" /><br />
        Guild & Character Data
      </a>
    </td>
    <td align="center">
      <a href="https://www.warcraftlogs.com/api/docs">
        <img src="https://img.shields.io/badge/WarcraftLogs%20API-FF4500?style=for-the-badge&logo=warcraft&logoColor=white" alt="WarcraftLogs API" /><br />
        Performance Metrics
      </a>
    </td>
    <td align="center">
      <a href="https://worldofwarcraft.com/">
        <img src="https://img.shields.io/badge/World%20of%20Warcraft-9F00FF?style=for-the-badge&logo=world-of-warcraft&logoColor=white" alt="World of Warcraft" /><br />
        Game Assets & Inspiration
      </a>
    </td>
  </tr>
</table>

---

<div align="center">
  <sub>
    Built with ❤️ by the Guttakrutt guild and community contributors | Updated May 2025
  </sub>
</div>