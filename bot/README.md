# MAMA Discord Bot

Standalone Discord bot for MAMA Personal Finance. This bot maintains a persistent connection to Discord, showing as "online" and handling slash commands and scheduled notifications.

## Features

- **Always Online**: Persistent WebSocket connection to Discord
- **Slash Commands**:
  - `/balance` - Show connected account balances
  - `/spending [days]` - Show spending breakdown by category
  - `/watchlist` - View stock watchlist with current prices
  - `/quote <symbol>` - Get a quick stock quote
  - `/help` - Show available commands
- **Scheduled Notifications**:
  - Weekly financial reports (Sundays at 2 PM UTC)
  - Budget alerts (Daily at 1 PM UTC)
  - Market alerts (Weekdays, hourly during market hours)

## Quick Start (hcloud Deployment)

### 1. SSH into your hcloud server

```bash
ssh root@your-server-ip
```

### 2. Install Docker (if not installed)

```bash
curl -fsSL https://get.docker.com | sh
```

### 3. Clone the repository

```bash
git clone https://github.com/swilhoit/personal-finance.git
cd personal-finance/bot
```

### 4. Create environment file

```bash
cp .env.example .env
nano .env
```

Fill in your values:
```env
DISCORD_BOT_TOKEN=MTQ0MjY3MDkwNjE4NjEzNzc3Ng.xxx.xxx
DISCORD_CLIENT_ID=1442670906186137776
SUPABASE_URL=https://ymxhsdtagnalxebnskst.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx
```

### 5. Register slash commands (one-time setup)

```bash
# Install dependencies locally first
npm install

# Register commands globally
npm run register-commands

# Or register to a specific guild for instant testing
npm run register-commands YOUR_GUILD_ID
```

### 6. Build and run with Docker

```bash
docker compose up -d --build
```

### 7. Check logs

```bash
docker compose logs -f
```

You should see:
```
MAMA Bot is online as MAMA#1234
Serving X guilds
Starting scheduled task runner...
```

## Manual Deployment (without Docker)

### 1. Install Node.js 20+

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Install PM2 for process management

```bash
npm install -g pm2
```

### 3. Build and run

```bash
cd bot
npm install
npm run build
pm2 start dist/index.js --name mama-bot
pm2 save
pm2 startup
```

## Configuration

### Discord Developer Portal Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application (or create one)
3. Go to **Bot** section
4. Reset and copy the **Bot Token**
5. Enable these **Privileged Gateway Intents**:
   - Server Members Intent (optional)
   - Message Content Intent (optional)
6. Go to **OAuth2** > **URL Generator**
7. Select scopes: `bot`, `applications.commands`
8. Select permissions: `Send Messages`, `Embed Links`, `Read Message History`
9. Use the generated URL to invite the bot to your server

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DISCORD_BOT_TOKEN` | Bot token from Discord Developer Portal |
| `DISCORD_CLIENT_ID` | Application ID from Discord Developer Portal |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for admin access) |

## Commands

### Docker Commands

```bash
# Start the bot
docker compose up -d

# Stop the bot
docker compose down

# View logs
docker compose logs -f

# Rebuild after code changes
docker compose up -d --build

# Check status
docker compose ps
```

### PM2 Commands (manual deployment)

```bash
# Start
pm2 start dist/index.js --name mama-bot

# Stop
pm2 stop mama-bot

# Restart
pm2 restart mama-bot

# View logs
pm2 logs mama-bot

# Monitor
pm2 monit
```

## Updating

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker compose up -d --build

# Re-register commands (if new commands added)
npm run register-commands
```

## Troubleshooting

### Bot shows offline
- Check that `DISCORD_BOT_TOKEN` is correct
- Verify bot intents are enabled in Discord Developer Portal
- Check container logs: `docker compose logs`

### Commands not appearing
- Run `npm run register-commands` to register commands
- Global commands take up to 1 hour to appear
- Use guild-specific registration for instant testing

### Scheduled notifications not sending
- Verify user has enabled notifications in MAMA dashboard
- Check that `discord_channel_id` is set in `notification_schedules` table
- Verify bot has permission to send messages in the channel

### Connection errors
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Verify network connectivity to Supabase

## Architecture

```
bot/
├── src/
│   ├── index.ts           # Main entry point, Discord client
│   ├── scheduler.ts       # Scheduled task runner (node-cron)
│   ├── utils.ts           # Utility functions
│   └── commands/
│       ├── balance.ts     # /balance command
│       ├── spending.ts    # /spending command
│       ├── watchlist.ts   # /watchlist command
│       ├── quote.ts       # /quote command
│       └── help.ts        # /help command
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## License

MIT
