# Discord Bot Integration Setup Guide

This guide explains how to set up and use the Discord bot integration for your Personal Finance app.

## Overview

The Discord integration allows users to:
- Connect their Discord account via OAuth
- Link Discord servers (guilds) to receive financial notifications
- Use Discord bot commands to check balances, spending, stock quotes, and watchlists
- Receive automated alerts for budgets, transactions, and market movements

## Architecture

The integration uses a multi-tenant architecture where:
1. Each user connects their Discord account via OAuth
2. Users can link multiple Discord servers where they have admin permissions
3. The bot serves all users from a single Discord application
4. Commands and data are scoped to the authenticated user who owns the linked server

## Setup Steps

### 1. Database Migration

Run the migration to create required tables:

```bash
npx supabase migration up
```

This creates the following tables:
- `oauth_states` - Temporary OAuth state storage (CSRF protection)
- `discord_connections` - Links Supabase users to Discord accounts
- `discord_guilds` - Tracks linked Discord servers
- `teller_enrollments` - Teller bank account enrollments
- `teller_accounts` - Connected bank accounts
- `transactions` - Transaction history
- `user_watchlists` - Stock watchlists
- `market_data` - Stock market quotes
- `discord_notifications` - Notification delivery log

### 2. Discord Application Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or use existing one
3. Navigate to **OAuth2** section
4. Add redirect URI: `https://your-domain.com/api/discord/oauth/callback`
5. Navigate to **Bot** section
6. Create a bot and copy the bot token
7. Enable required intents:
   - Server Members Intent (optional, for member info)
   - Message Content Intent (if needed for message commands)

### 3. Environment Variables

Add these to your `.env` or `.env.local`:

```bash
# Discord OAuth
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_PUBLIC_KEY=your_discord_public_key
DISCORD_REDIRECT_URI=https://your-domain.com/api/discord/oauth/callback

# Site URL (for OAuth redirects)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 4. Register Discord Slash Commands

You need to register the bot's slash commands with Discord. Create a script `register-commands.js`:

```javascript
const { REST, Routes } = require('discord.js');

const commands = [
  {
    name: 'balance',
    description: 'Check your account balances',
  },
  {
    name: 'spending',
    description: 'View your spending summary',
    options: [
      {
        name: 'days',
        type: 4, // INTEGER
        description: 'Number of days to analyze (default: 7)',
        required: false,
      },
    ],
  },
  {
    name: 'watchlist',
    description: 'View your stock watchlist',
  },
  {
    name: 'quote',
    description: 'Get a stock quote',
    options: [
      {
        name: 'symbol',
        type: 3, // STRING
        description: 'Stock symbol (e.g., AAPL)',
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
```

Run it:
```bash
npm install discord.js
node register-commands.js
```

### 5. Configure Discord Interactions Endpoint

1. Go to Discord Developer Portal > Your App > General Information
2. Set **Interactions Endpoint URL** to: `https://your-domain.com/api/discord/webhook`
3. Discord will verify the endpoint (make sure your app is deployed first)

## User Flow

### For End Users

1. **Connect Discord Account**
   - Navigate to `/settings/integrations`
   - Click "Connect Discord"
   - Authorize the app via Discord OAuth
   - User is redirected back with Discord account linked

2. **Invite Bot to Server**
   - After connecting Discord account, click "Invite Bot to Server"
   - Select which Discord server to add the bot to
   - Grant necessary permissions

3. **Link Server**
   - On the integrations page, click "Load My Servers"
   - Select which server(s) should receive financial notifications
   - Click "Link" on the desired server

4. **Use Bot Commands**
   - In any channel on the linked server, use slash commands:
     - `/balance` - View account balances
     - `/spending [days]` - View spending summary
     - `/watchlist` - View stock watchlist
     - `/quote [symbol]` - Get stock quote

## API Endpoints

### Discord OAuth
- `GET /api/discord/oauth/authorize` - Initiate OAuth flow
- `GET /api/discord/oauth/callback` - Handle OAuth callback

### Discord Connection
- `GET /api/discord/connection` - Get connection status
- `DELETE /api/discord/connection` - Disconnect Discord

### Discord Guilds
- `GET /api/discord/guilds` - Get user's Discord servers
- `POST /api/discord/guilds` - Link a Discord server

### Discord Webhook
- `POST /api/discord/webhook` - Handle Discord interactions (commands)

### Discord Registration
- `GET /api/discord/register` - Get registration status
- `POST /api/discord/register` - Register a guild (legacy)
- `DELETE /api/discord/register` - Unlink a guild

## Security Considerations

### Production Deployment Checklist

1. **Encrypt Sensitive Tokens**
   - Currently, `access_token` and `refresh_token` are stored as plain text
   - In production, encrypt these using environment-based encryption
   - Update the following files:
     - `src/app/api/discord/oauth/callback/route.ts`
     - `src/app/api/discord/guilds/route.ts`
     - Anywhere tokens are read/written

2. **Signature Verification**
   - The webhook route has signature verification commented out
   - Uncomment and implement in `src/app/api/discord/webhook/route.ts:18-23`
   - Use Discord's `nacl` library to verify signatures

3. **Rate Limiting**
   - Add rate limiting to all API endpoints
   - Especially important for OAuth endpoints to prevent abuse

4. **HTTPS Only**
   - Ensure all endpoints are served over HTTPS
   - Discord requires HTTPS for OAuth redirects and webhooks

5. **Environment Variables**
   - Never commit `.env` files
   - Use a secrets manager in production
   - Rotate secrets periodically

## Row Level Security (RLS)

All tables have RLS policies that ensure users can only access their own data:
- Discord connections are user-scoped
- Guilds are user-scoped
- Teller enrollments and accounts are user-scoped
- Transactions are user-scoped
- Watchlists are user-scoped

The webhook handler uses the Supabase service role key to access data across users, but always resolves the correct user based on guild membership.

## Troubleshooting

### Bot Commands Not Working
1. Verify commands are registered (run `register-commands.js`)
2. Check that the interactions endpoint URL is correct
3. Ensure the server is linked in the integrations page
4. Check server logs for webhook errors

### OAuth Flow Failing
1. Verify redirect URI matches exactly in Discord Developer Portal
2. Check that `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` are correct
3. Ensure cookies are enabled (for session state)

### Can't See Discord Servers
1. User must have "Manage Server" permission on the Discord server
2. Discord account must be connected first
3. Bot must be invited to the server before it appears in the list

### Tokens Expired
- OAuth tokens refresh automatically when expired
- If refresh fails, user needs to reconnect Discord account

## Future Enhancements

1. **Channel Configuration**
   - Allow users to specify which channels receive notifications
   - Separate channels for different notification types

2. **Notification Preferences**
   - Granular control over which notifications to receive
   - Threshold settings for alerts

3. **Multi-Guild Support**
   - Currently one guild per user is fully supported
   - Could extend to support multiple guilds with different configs

4. **DM Notifications**
   - Option to receive notifications via Discord DMs instead of server channels

5. **Interactive Components**
   - Use Discord buttons and select menus for interactive commands
   - Build mini-dashboards directly in Discord

## Support

For issues or questions:
- Check GitHub issues
- Review Discord API documentation
- Check Supabase logs for database errors
- Review Next.js logs for API errors
