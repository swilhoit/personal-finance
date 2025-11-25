# Discord Bot Setup

## Invite the Bot to Your Server

Use this link to invite the Finance AI bot to your Discord server:

**Bot Invite URL:**
```
https://discord.com/oauth2/authorize?client_id=1442670906186137776&permissions=3147776&scope=bot%20applications.commands
```

Or click here: [Invite Finance AI Bot](https://discord.com/oauth2/authorize?client_id=1442670906186137776&permissions=3147776&scope=bot%20applications.commands)

## Permissions

The bot requires the following permissions:
- **Send Messages** - To send notifications and command responses
- **Embed Links** - To send rich embedded messages with financial data
- **Read Message History** - To understand context for commands
- **Use Slash Commands** - To enable `/balance`, `/spending`, `/watchlist`, and `/quote` commands

## Setup Steps

1. **Invite the Bot**
   - Click the invite link above
   - Select your Discord server from the dropdown
   - Click "Authorize"
   - Complete the CAPTCHA if prompted

2. **Connect Your Account**
   - Go to [Settings → Integrations](https://personal-finance-a58oftjam-swilhoits-projects.vercel.app/settings/integrations)
   - Click "Connect Discord"
   - Authorize the connection
   - Click "Load My Servers"
   - Click "Link" next to your server name

3. **Link Your Bank Account** (Required for bot commands)
   - Go to [Dashboard](https://personal-finance-a58oftjam-swilhoits-projects.vercel.app/dashboard) or [Settings → Integrations](https://personal-finance-a58oftjam-swilhoits-projects.vercel.app/settings/integrations)
   - Click "Connect Bank Account"
   - Follow the Teller Connect flow

## Available Commands

Once set up, use these slash commands in Discord:

- `/balance` - View your account balances
- `/spending [days]` - View spending over the last X days (default: 7)
- `/watchlist` - View your stock watchlist with current prices
- `/quote [symbol]` - Get a stock quote (e.g., `/quote AAPL`)

## Troubleshooting

**Bot doesn't appear in server list?**
- Make sure you have "Manage Server" permissions on the Discord server
- Try refreshing the page after inviting the bot

**Commands not working?**
- Make sure your Discord account is connected in Settings → Integrations
- Make sure your server is linked (green checkmark should show)
- Make sure you have connected a bank account

**Bot not responding?**
- The bot may be offline or restarting. Check back in a few minutes.
- Verify the bot has proper permissions in your Discord server settings

## Support

If you need help:
- Check that all environment variables are configured correctly
- Verify your Discord connection in Settings → Integrations
- Ensure your bank account is connected and synced

## Configuration (For Developers)

Environment variables needed:
```
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CLIENT_ID=1442670906186137776
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_PUBLIC_KEY=your_public_key
```

Bot application settings can be managed at:
https://discord.com/developers/applications/1442670906186137776
