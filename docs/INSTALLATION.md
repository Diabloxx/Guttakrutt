# Guttakrutt Guild Website Installation Guide

This guide provides comprehensive instructions for installing and configuring the Guttakrutt Guild Website application.

## Prerequisites

- Node.js (v16+)
- PostgreSQL or MySQL database
- API keys for Blizzard and WarcraftLogs (optional for some features)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/guttakrutt-guild-website.git
cd guttakrutt-guild-website
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

#### Core Settings

```
NODE_ENV=development
PORT=5000
SESSION_SECRET=your_secure_session_secret
```

#### Database Configuration

**PostgreSQL (Default)**
```
DATABASE_URL=postgresql://username:password@localhost:5432/guttakrutt
```

**MySQL**
```
DB_TYPE=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=guttakrutt
```

### 4. Database Setup

#### PostgreSQL Setup

1. Create a PostgreSQL database:
   ```sql
   CREATE DATABASE guttakrutt;
   ```

2. Run the database migration:
   ```bash
   npm run db:push
   ```

#### MySQL Setup

1. Create a MySQL database:
   ```sql
   CREATE DATABASE guttakrutt;
   ```

2. Run the database setup script:
   ```bash
   npm run db:push
   ```

3. For Windows users with MySQL, you can use the included batch files:
   - `setup-mysql8-full.bat`: Sets up MySQL 8 with full configuration
   - `start-with-mysql.bat`: Starts the application with MySQL database

### 5. API Configuration

For full functionality, you'll need to set up the Blizzard and WarcraftLogs APIs. See [WOW_API_SETUP.md](./WOW_API_SETUP.md) for detailed instructions.

#### Quick API Setup

Add the following to your `.env` file with your API credentials:

```
# Blizzard API
BLIZZARD_CLIENT_ID=your_client_id
BLIZZARD_CLIENT_SECRET=your_client_secret
BLIZZARD_REGION=eu

# WarcraftLogs API
WARCRAFTLOGS_CLIENT_ID=your_client_id
WARCRAFTLOGS_CLIENT_SECRET=your_client_secret

# Raider.IO API
RAIDER_IO_API_KEY=your_api_key
```

### 6. Starting the Application

#### Development Mode

```bash
npm run dev
```

This will start both the backend server and the frontend development server with hot-reloading enabled.

#### Production Mode

```bash
npm run build
npm start
```

The application will be available at `http://localhost:5000` by default.

## Admin Setup

On first launch, the system automatically creates a default admin account:

- Username: `admin`
- Password: `admin123`

**Important Security Note:** Change this password immediately after your first login!

### Creating Additional Admin Users

1. Log in with the default admin account
2. Navigate to the Admin Panel
3. Go to Admin Users section
4. Click "Create New Admin User"
5. Fill in the username and password

## Database Maintenance

### Backups

It's recommended to set up regular database backups.

**PostgreSQL**
```bash
pg_dump -U username -d guttakrutt > backup.sql
```

**MySQL**
```bash
mysqldump -u username -p guttakrutt > backup.sql
```

### Schema Updates

When upgrading to a new version of the application, run:

```bash
npm run db:push
```

This will apply any schema changes without losing your data.

## Troubleshooting

### Common Issues

#### Database Connection Issues

- Ensure your database credentials are correct in `.env`
- For PostgreSQL, make sure the database exists
- For MySQL, ensure the user has appropriate permissions

#### API Data Not Updating

- Check API credentials in `.env`
- Verify Raider.IO and WarcraftLogs API status
- Try manual refresh from admin panel

#### Admin Access Issues

If you forgot the admin password, you can reset it by:
1. Connect to your database
2. Update the password hash in the `admin_users` table
3. New hash can be generated using the utility in `server/adminAuth.ts`

### Error Logs

Check the server logs for detailed error messages:

```bash
npm run dev:debug
```

This will start the server with additional debug information.

## MySQL Compatibility Notes

For MySQL users, be aware of the following:

1. Set `DB_TYPE=mysql` in your `.env` file
2. The application handles MySQL-specific limitations automatically
3. For complex MySQL configurations, see [MYSQL_COMPATIBILITY_GUIDE.md](./MYSQL_COMPATIBILITY_GUIDE.md)
4. If you encounter character score issues, run the fix script:
   ```
   node fix-mysql-character-scores.js
   ```

## Support and Resources

- Report issues on the GitHub repository
- For API integration help, see [WOW_API_SETUP.md](./WOW_API_SETUP.md)
- For MySQL compatibility details, see [MYSQL_COMPATIBILITY_GUIDE.md](./MYSQL_COMPATIBILITY_GUIDE.md)
- For administrator guidance, see [ADMIN_USER_GUIDE.md](./ADMIN_USER_GUIDE.md)