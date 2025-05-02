# Token Management Guide

This document explains how authentication tokens and API keys are managed in the Guttakrutt Guild Website project.

## Token Files

### token.json

The `token.json` file is used to store API tokens that might be generated during the application's runtime. This file should never be committed to version control and is included in `.gitignore`.

A template example is provided in `token.json.example` showing the expected structure:

```json
{
  "blizzard": {
    "access_token": "YOUR_BLIZZARD_ACCESS_TOKEN",
    "refresh_token": "YOUR_BLIZZARD_REFRESH_TOKEN",
    "token_type": "bearer",
    "expires_in": 86400,
    "expires_at": "2025-05-02T23:59:59Z",
    "scope": "openid wow.profile"
  },
  "warcraftlogs": {
    "access_token": "YOUR_WARCRAFTLOGS_ACCESS_TOKEN",
    "expires_in": 86400,
    "expires_at": "2025-05-02T23:59:59Z",
    "token_type": "bearer"
  },
  "raiderio": {
    "api_key": "YOUR_RAIDERIO_API_KEY"
  }
}
```

## API Keys vs. Tokens

There's an important distinction between API keys and tokens:

1. **API Keys**: These are client credentials provided by services like Battle.net, WarcraftLogs, and Raider.IO. They are configured in environment variables and do not change frequently.

2. **Tokens**: These are temporary access tokens generated during OAuth flows or API authentication. They have expiration times and may need to be refreshed.

## Environment Variables

The primary way to configure API keys is through environment variables:

```
# Battle.net API
BLIZZARD_CLIENT_ID=your_blizzard_client_id
BLIZZARD_CLIENT_SECRET=your_blizzard_client_secret

# WarcraftLogs API 
WARCRAFTLOGS_CLIENT_ID=your_warcraftlogs_client_id
WARCRAFTLOGS_CLIENT_SECRET=your_warcraftlogs_client_secret

# Raider.IO API (optional for advanced features)
RAIDER_IO_API_KEY=your_raiderio_api_key
```

## Token Management Flow

1. **Initial Authentication**: When a user authenticates with Battle.net, the application receives access tokens and refresh tokens.

2. **Token Storage**: The application might store these tokens either:
   - Temporarily in memory
   - In the user's session
   - In the database associated with the user
   - In the `token.json` file for application-level tokens

3. **Token Refresh**: When tokens expire, the application automatically refreshes them using refresh tokens or client credentials.

## Security Best Practices

1. **Never commit tokens to version control**
   - Keep `token.json` in your `.gitignore`
   - Use environment variables for API keys

2. **Secure storage**
   - Store tokens encrypted when possible
   - Use secure environment variable management in production

3. **Token rotation**
   - Implement regular rotation of long-lived tokens
   - Monitor for token expiration and handle refreshes properly

4. **Access restrictions**
   - Limit token permissions to only what is necessary
   - Implement proper authentication checks before accessing protected resources

## Troubleshooting

If you encounter authentication issues:

1. Check if your API keys are correctly configured in environment variables
2. Verify any token files are properly formatted
3. Check token expiration times and refresh mechanisms
4. Look for authentication errors in the application logs

## Additional Resources

For more information about the specific APIs used:

- [Battle.net OAuth Documentation](https://develop.battle.net/documentation/guides/using-oauth)
- [WarcraftLogs API Documentation](https://www.warcraftlogs.com/api/docs)
- [Raider.IO API Documentation](https://raider.io/api)