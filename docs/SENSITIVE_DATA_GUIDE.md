# Sensitive Data Guide

This document provides a comprehensive guide on what sensitive data needs to be added to various files in the Guttakrutt Guild Website project, and how to properly secure this information.

## Table of Contents

1. [Overview of Sensitive Data](#overview-of-sensitive-data)
2. [Required API Keys and Secrets](#required-api-keys-and-secrets)
3. [Environment Variables Setup](#environment-variables-setup)
4. [Database Credentials](#database-credentials)
5. [Session and Authentication Settings](#session-and-authentication-settings)
6. [Production Deployment Security](#production-deployment-security)
7. [Security Best Practices](#security-best-practices)

## Overview of Sensitive Data

The application requires several types of sensitive data to function properly:

- **API Keys**: Access credentials for Blizzard, WarcraftLogs, and Raider.IO APIs
- **Database Credentials**: Connection strings for PostgreSQL or MySQL databases
- **Session Secrets**: Cryptographic keys for securing user sessions
- **OAuth Tokens**: Refresh and access tokens for Battle.net authentication
- **Admin Credentials**: Login information for administrative users

All of these should be kept secure and never committed to version control.

## Required API Keys and Secrets

### 1. Battle.net API Credentials

**Required for**: Authentication and retrieving World of Warcraft character and guild data.

**How to obtain**:
1. Go to the [Blizzard Developer Portal](https://develop.battle.net/)
2. Create a new application or use an existing one
3. Set the redirect URL to your production domain's callback URL (e.g., `https://guttakrutt.org/auth-callback.php`)
4. Copy the Client ID and Client Secret

**Where to add**:
- Add to `.env` file as `BLIZZARD_CLIENT_ID` and `BLIZZARD_CLIENT_SECRET`
- For production: Add to your server's environment variables

### 2. WarcraftLogs API Credentials

**Required for**: Retrieving raid performance data and parse percentiles.

**How to obtain**:
1. Go to [WarcraftLogs API Clients](https://www.warcraftlogs.com/api/clients/)
2. Create a new client
3. Set the redirect URL if you're using OAuth (optional)
4. Copy the Client ID and Client Secret

**Where to add**:
- Add to `.env` file as `WARCRAFTLOGS_CLIENT_ID` and `WARCRAFTLOGS_CLIENT_SECRET`
- For production: Add to your server's environment variables

### 3. Raider.IO API Key

**Required for**: Enhanced guild and character data, M+ scores, and rankings.

**How to obtain**:
1. Basic access is available without authentication
2. For advanced features, contact Raider.IO for an API key

**Where to add**:
- Add to `.env` file as `RAIDER_IO_API_KEY`
- For production: Add to your server's environment variables

## Environment Variables Setup

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

# Optional Environment-specific Settings
NODE_ENV=development # or production
PORT=5000 # default port for the application
```

**Important**: Never commit the `.env` file to version control.

## Database Credentials

### PostgreSQL (Development)

For development with PostgreSQL, set up your `DATABASE_URL` in the `.env` file:

```
DATABASE_URL=postgresql://username:password@localhost:5432/guttakrutt
```

### MySQL (Production)

For production with MySQL, set up your `DATABASE_URL` in the `.env` file or server environment:

```
DATABASE_URL=mysql://username:password@hostname:3306/guttakrutt
```

**Security Notes**:
- Use a dedicated database user with limited permissions
- Don't use the root user for MySQL or the postgres user for PostgreSQL
- Set strong passwords and restrict network access to your database server

## Session and Authentication Settings

### Session Secret

A strong, random string used to sign session cookies. Set this in your `.env` file:

```
SESSION_SECRET=your_random_string_here
```

You can generate a secure random string using:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### OAuth Callback URLs

When registering your application with Battle.net, WarcraftLogs, or other OAuth providers, ensure your callback URLs match your deployment environment:

- Development: `http://localhost:5000/auth-callback.php`
- Production: `https://guttakrutt.org/auth-callback.php`

## Production Deployment Security

When deploying to production, follow these additional steps:

1. **Use Environment Variables**: Don't rely on `.env` files in production
   
2. **HTTPS Only**: Ensure your site uses HTTPS with a valid SSL certificate

3. **Secure Headers**: Implement security headers like:
   - Content-Security-Policy
   - X-Content-Type-Options
   - X-Frame-Options
   - Strict-Transport-Security
   
4. **Rate Limiting**: Apply rate limiting to authentication endpoints

5. **IP Restrictions**: Consider restricting admin access by IP where possible

## Security Best Practices

1. **Rotate Secrets Regularly**: Change API keys and secrets periodically

2. **Principle of Least Privilege**: API keys and database users should have only the permissions they need

3. **Monitoring**: Set up logging of authentication attempts and API usage

4. **Token Storage**: Store OAuth tokens securely, preferably encrypted in the database

5. **Defense in Depth**: Don't rely on a single security measure; use multiple layers of protection

6. **Secure Code Practices**:
   - Validate all user inputs
   - Use parameterized queries for database operations
   - Keep dependencies updated

7. **Security Scans**: Regularly scan your application for vulnerabilities

---

## Files That May Contain Sensitive Data

Be particularly careful with these files:

1. `.env`: Contains all API keys and secrets
2. `token.json`: Contains Battle.net refresh tokens
3. `server/config/*.json`: May contain environment-specific configurations
4. Database backup files
5. Log files that might contain token information
6. Session storage files

All these files are included in the `.gitignore` to prevent accidental commits.