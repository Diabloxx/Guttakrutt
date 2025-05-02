# Installation and Running Guide

This document provides detailed instructions for installing and running the Guttakrutt Guild Website on different operating systems.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Windows Installation](#windows-installation)
3. [macOS Installation](#macos-installation)
4. [Linux Installation](#linux-installation)
5. [Docker Installation](#docker-installation)
6. [Database Configuration](#database-configuration)
7. [API Keys Configuration](#api-keys-configuration)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, make sure you have the following:

- Node.js 18.x or higher ([Download Node.js](https://nodejs.org/))
- npm 9.x or higher (comes with Node.js)
- Database (PostgreSQL 14+ or MySQL 8+)
  - [PostgreSQL Download](https://www.postgresql.org/download/)
  - [MySQL Download](https://dev.mysql.com/downloads/mysql/)
- API keys from Battle.net, WarcraftLogs, and optionally Raider.IO
  - [Battle.net Developer Portal](https://develop.battle.net/)
  - [WarcraftLogs API Clients](https://www.warcraftlogs.com/api/clients/)
  - [Raider.IO API](https://raider.io/api)

## Windows Installation

### Step 1: Clone the Repository

```cmd
git clone https://github.com/yourusername/guttakrutt-guild.git
cd guttakrutt-guild
```

### Step 2: Install Dependencies

```cmd
npm install
npm install -g tsx cross-env
```

### Step 3: Configure Environment

Create a copy of `.env.example` and name it `.env`:

```cmd
copy .env.example .env
```

Edit the `.env` file to add your database connection details and API keys.

### Step 4: Run the Application

You can run the application using the provided script:

```cmd
start-dev-windows.bat
```

**Note**: Before running the batch file, make sure to edit it to include your database credentials and API keys.

Alternatively, you can run the application using npm:

```cmd
npm run dev
```

## macOS Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/guttakrutt-guild.git
cd guttakrutt-guild
```

### Step 2: Install Dependencies

```bash
npm install
npm install -g tsx cross-env
```

### Step 3: Configure Environment

Create a copy of `.env.example` and name it `.env`:

```bash
cp .env.example .env
```

Edit the `.env` file to add your database connection details and API keys.

### Step 4: Run the Application

Create a script to run the application with environment variables:

Create a file named `start-dev-mac.sh`:

```bash
#!/bin/bash

# Create logs directory if it doesn't exist
mkdir -p logs

# Set log file with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOGFILE="logs/guttakrutt_$TIMESTAMP.log"

# Create log file with header
echo "Guttakrutt Guild Website - Database Connection Log" > $LOGFILE
echo "Timestamp: $(date)" >> $LOGFILE
echo "" >> $LOGFILE

# Run the application
echo "Running application..."
echo "Running application..." >> $LOGFILE

NODE_ENV=development \
DB_TYPE=postgresql \
DATABASE_URL=postgresql://user:password@localhost:5432/guttakrutt \
BLIZZARD_CLIENT_ID=your_client_id \
BLIZZARD_CLIENT_SECRET=your_client_secret \
WARCRAFTLOGS_CLIENT_ID=your_client_id \
WARCRAFTLOGS_CLIENT_SECRET=your_client_secret \
npx tsx server/index.ts

echo "Application exited with code $?"
echo "Application exited with code $?" >> $LOGFILE
```

Make it executable:

```bash
chmod +x start-dev-mac.sh
```

Run the script:

```bash
./start-dev-mac.sh
```

Alternatively, you can run the application using npm:

```bash
npm run dev
```

## Linux Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/guttakrutt-guild.git
cd guttakrutt-guild
```

### Step 2: Install Dependencies

```bash
npm install
npm install -g tsx cross-env
```

If you don't have permission to install global packages, you can use:

```bash
npm install
npm install tsx cross-env --save-dev
```

### Step 3: Configure Environment

Create a copy of `.env.example` and name it `.env`:

```bash
cp .env.example .env
```

Edit the `.env` file to add your database connection details and API keys.

### Step 4: Run the Application

Create a script to run the application with environment variables:

Create a file named `start-dev-linux.sh`:

```bash
#!/bin/bash

# Create logs directory if it doesn't exist
mkdir -p logs

# Set log file with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOGFILE="logs/guttakrutt_$TIMESTAMP.log"

# Create log file with header
echo "Guttakrutt Guild Website - Database Connection Log" > $LOGFILE
echo "Timestamp: $(date)" >> $LOGFILE
echo "" >> $LOGFILE

# Run the application
echo "Running application..."
echo "Running application..." >> $LOGFILE

NODE_ENV=development \
DB_TYPE=postgresql \
DATABASE_URL=postgresql://user:password@localhost:5432/guttakrutt \
BLIZZARD_CLIENT_ID=your_client_id \
BLIZZARD_CLIENT_SECRET=your_client_secret \
WARCRAFTLOGS_CLIENT_ID=your_client_id \
WARCRAFTLOGS_CLIENT_SECRET=your_client_secret \
npx tsx server/index.ts

echo "Application exited with code $?"
echo "Application exited with code $?" >> $LOGFILE
```

Make it executable:

```bash
chmod +x start-dev-linux.sh
```

Run the script:

```bash
./start-dev-linux.sh
```

Alternatively, you can run the application using npm:

```bash
npm run dev
```

## Docker Installation

### Step 1: Create a Dockerfile

Create a `Dockerfile` in the root directory:

```Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

### Step 2: Create a Docker Compose file

Create a `docker-compose.yml` in the root directory:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DB_TYPE=postgresql
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/guttakrutt
      - BLIZZARD_CLIENT_ID=${BLIZZARD_CLIENT_ID}
      - BLIZZARD_CLIENT_SECRET=${BLIZZARD_CLIENT_SECRET}
      - WARCRAFTLOGS_CLIENT_ID=${WARCRAFTLOGS_CLIENT_ID}
      - WARCRAFTLOGS_CLIENT_SECRET=${WARCRAFTLOGS_CLIENT_SECRET}
      - SESSION_SECRET=${SESSION_SECRET}
    depends_on:
      - db
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=guttakrutt
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### Step 3: Run with Docker Compose

```bash
docker-compose up -d
```

## Database Configuration

The application supports both PostgreSQL and MySQL databases:

### PostgreSQL Configuration

1. Create a PostgreSQL database:
```sql
CREATE DATABASE guttakrutt;
CREATE USER guttakrutt_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE guttakrutt TO guttakrutt_user;
```

2. Update your `.env` file:
```
DB_TYPE=postgres
DATABASE_URL=postgresql://guttakrutt_user:your_password@localhost:5432/guttakrutt
```

### MySQL Configuration

1. Create a MySQL database:
```sql
CREATE DATABASE guttakrutt;
CREATE USER 'guttakrutt_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON guttakrutt.* TO 'guttakrutt_user'@'localhost';
FLUSH PRIVILEGES;
```

2. Update your `.env` file:
```
DB_TYPE=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=guttakrutt_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=guttakrutt
```

## API Keys Configuration

### Battle.net API

1. Go to the [Battle.net Developer Portal](https://develop.battle.net/)
2. Create a new client
3. Set the redirect URL to your callback URL (e.g., `http://localhost:5000/auth-callback.php` for development)
4. Copy the Client ID and Client Secret to your `.env` file:
```
BLIZZARD_CLIENT_ID=your_client_id
BLIZZARD_CLIENT_SECRET=your_client_secret
```

### WarcraftLogs API

1. Go to [WarcraftLogs API Clients](https://www.warcraftlogs.com/api/clients/)
2. Create a new client
3. Copy the Client ID and Client Secret to your `.env` file:
```
WARCRAFTLOGS_CLIENT_ID=your_client_id
WARCRAFTLOGS_CLIENT_SECRET=your_client_secret
```

### Raider.IO API (Optional)

For basic features, the Raider.IO API doesn't require authentication. For advanced features:

1. Contact Raider.IO to request an API key
2. Add the API key to your `.env` file:
```
RAIDER_IO_API_KEY=your_api_key
```

## Troubleshooting

### Database Connection Issues

#### PostgreSQL

- Ensure PostgreSQL service is running
- Verify database user has proper permissions
- Check connection string format: `postgresql://user:password@host:port/database`
- If using Docker, ensure the database container is running

#### MySQL

- Ensure MySQL service is running
- Verify database user has proper permissions
- Check MySQL credentials in the `.env` file or startup script
- For connection errors, check if MySQL is listening on the specified port
- If using Docker, ensure the database container is running

### API Authentication Issues

- Verify your API keys are correctly entered in the `.env` file
- Ensure the redirect URI in your Battle.net Developer Portal matches your application's callback URL
- Check for CORS issues if running on a different domain
- Try refreshing your API keys or generating new ones

### Application Startup Issues

- Ensure all required Node.js modules are installed
- Check for TypeScript compilation errors
- Verify Node.js version (should be 18.x or higher)
- Check log files in the `logs` directory for detailed error messages
- For permission issues on Linux/macOS, ensure script files are executable