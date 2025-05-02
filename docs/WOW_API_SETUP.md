# World of Warcraft API Integration Guide

This guide provides comprehensive instructions for setting up and using the Blizzard and WarcraftLogs API integrations in the Guttakrutt Guild Website.

## Overview

The Guttakrutt Guild Website integrates with two primary APIs:

1. **Blizzard API** - For basic WoW game data (characters, guilds, etc.)
2. **WarcraftLogs API** - For raid performance metrics and analysis

Both APIs require registration and authentication.

## Blizzard API Setup

### Step 1: Register a Blizzard Developer Account

1. Go to the [Blizzard Developer Portal](https://develop.battle.net/)
2. Sign in with your Battle.net account or create a new one
3. Click "Create New Client" in the API Access section

### Step 2: Create a Client

1. Fill in the required information:
   - Name: "Guttakrutt Guild Website" (or your preferred name)
   - Type: Web
   - Redirect URIs: Your website's URL (e.g., `https://yourdomain.com/auth/callback`)
   - Service URL: Your website's URL
   - Description: "Guild management website for Guttakrutt"

2. After creating the client, you'll receive:
   - Client ID
   - Client Secret

### Step 3: Configure Environment Variables

Add the following to your `.env` file:

```
BLIZZARD_CLIENT_ID=your_client_id
BLIZZARD_CLIENT_SECRET=your_client_secret
BLIZZARD_REGION=eu  # Change to 'us', 'kr', etc. based on your guild's region
BLIZZARD_LOCALE=en_GB  # Change based on your preferred locale
```

## WarcraftLogs API Setup

### Step 1: Register a WarcraftLogs Account

1. Go to [WarcraftLogs](https://www.warcraftlogs.com/)
2. Create an account or sign in with your existing account

### Step 2: Create a Client

1. Navigate to [WarcraftLogs API Clients](https://www.warcraftlogs.com/api/clients/)
2. Click "Create Client"
3. Fill in the required information:
   - Name: "Guttakrutt Guild Website" (or your preferred name)
   - Redirect URI: Your website's URL (if using OAuth)

4. After creating the client, you'll receive:
   - Client ID
   - Client Secret

### Step 3: Configure Environment Variables

Add the following to your `.env` file:

```
WARCRAFTLOGS_CLIENT_ID=your_client_id
WARCRAFTLOGS_CLIENT_SECRET=your_client_secret
```

## Using the APIs in the Application

### Automatic Data Updates

The application is configured to automatically update data daily from both APIs:

1. **Guild Information** - Updates basic guild profile from Raider.IO
2. **Roster Information** - Updates member list and character details
3. **Raid Progress** - Updates boss kill status
4. **Performance Metrics** - Updates DPS/HPS rankings and parse percentiles

You can trigger a manual update from the Admin Panel by clicking the "Refresh All Data" button.

### API Rate Limits

Be aware of the rate limits for each API:

**Blizzard API**:
- 36,000 requests per hour
- 100 requests per second

**WarcraftLogs API**:
- Varies by subscription tier
- Free tier has significant limitations

The application implements caching to minimize unnecessary API calls.

## API Data Structure

### Blizzard API Data

The Blizzard API provides:
- Guild profile information
- Character details and equipment
- Realm information
- Game data (classes, specs, items, etc.)

Example guild data structure:
```json
{
  "name": "Guttakrutt",
  "realm": {
    "name": "Tarren Mill",
    "slug": "tarren-mill"
  },
  "faction": {
    "type": "HORDE"
  },
  "member_count": 893
  // Other fields...
}
```

### WarcraftLogs API Data

The WarcraftLogs API provides:
- Raid reports and logs
- Boss kill data
- Performance rankings
- Parse percentiles

Example performance data structure:
```json
{
  "encounterID": 2529,
  "encounterName": "Tindral Sageswift, Seer of the Flame",
  "class": "Warrior",
  "spec": "Arms",
  "rank": 123,
  "outOf": 12500,
  "percentile": 99.1,
  "duration": 328000,
  "startTime": 1642586347000,
  "reportID": "a1b2c3d4e5f6"
  // Other fields...
}
```

## Troubleshooting

### Common API Issues

1. **Authentication Failures**
   - Verify your client ID and secret are correct
   - Check that your credentials haven't expired
   - Ensure your region settings match your guild's region

2. **Rate Limiting**
   - Implement appropriate caching
   - Add retry logic with exponential backoff
   - Consider upgrading to a higher tier for WarcraftLogs if needed

3. **Missing Data**
   - Ensure your guild name and realm are spelled correctly
   - Verify the character names are correct
   - Check if the logs are public on WarcraftLogs

### Debug Options

You can enable debug logging for API calls by setting:

```
API_DEBUG=true
```

This will output detailed API request and response information to the server logs.

## Advanced API Usage

### Custom API Queries

For advanced use cases, you can customize the API queries:

1. **Modify API Parameters** - Edit the query parameters in `server/api/blizzard.ts` or `server/api/warcraftlogs.ts`

2. **Add New Endpoints** - Implement additional API endpoints as needed

### API Proxying

To avoid exposing API credentials to the client, all API requests are proxied through the backend server. This ensures your API secrets remain secure.

Example proxy endpoint:
```javascript
app.get('/api/guild', async (req, res) => {
  try {
    const guildData = await fetchGuildData();
    res.json(guildData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch guild data' });
  }
});
```

## Further Resources

- [Blizzard API Documentation](https://develop.battle.net/documentation)
- [WarcraftLogs API Documentation](https://www.warcraftlogs.com/api/docs)
- [Raider.IO API Documentation](https://raider.io/api)