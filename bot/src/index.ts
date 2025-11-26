/**
 * MAMA Discord Bot
 * Standalone Discord bot for personal finance notifications and commands
 */

import { Client, GatewayIntentBits, Events, Collection, REST, Routes } from 'discord.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as cron from 'node-cron';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import commands
import { balanceCommand, handleBalance } from './commands/balance';
import { spendingCommand, handleSpending } from './commands/spending';
import { watchlistCommand, handleWatchlist } from './commands/watchlist';
import { quoteCommand, handleQuote } from './commands/quote';
import { helpCommand, handleHelp } from './commands/help';

// Import scheduler
import { startScheduler } from './scheduler';

// Validate required environment variables
const requiredEnvVars = [
  'DISCORD_BOT_TOKEN',
  'DISCORD_CLIENT_ID',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize Supabase client
export const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Create Discord client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

// Command collection
const commands = new Collection<string, { data: object; execute: Function }>();
commands.set('balance', { data: balanceCommand, execute: handleBalance });
commands.set('spending', { data: spendingCommand, execute: handleSpending });
commands.set('watchlist', { data: watchlistCommand, execute: handleWatchlist });
commands.set('quote', { data: quoteCommand, execute: handleQuote });
commands.set('help', { data: helpCommand, execute: handleHelp });

// Bot ready event
client.once(Events.ClientReady, (readyClient) => {
  console.log(`MAMA Bot is online as ${readyClient.user.tag}`);
  console.log(`Serving ${readyClient.guilds.cache.size} guilds`);

  // Set bot status
  readyClient.user.setPresence({
    activities: [{ name: 'your finances | /help', type: 3 }], // Watching
    status: 'online',
  });

  // Start the scheduled tasks
  startScheduler(client, supabase);
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction, supabase);
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);

    const errorMessage = {
      content: 'There was an error executing this command.',
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Handle guild join (bot added to server)
client.on(Events.GuildCreate, async (guild) => {
  console.log(`Joined new guild: ${guild.name} (${guild.id})`);

  // Log to database
  try {
    await supabase.from('bot_guild_events').insert({
      guild_id: guild.id,
      guild_name: guild.name,
      event_type: 'join',
      member_count: guild.memberCount,
    });
  } catch (err) {
    console.error('Error logging guild join:', err);
  }
});

// Handle guild leave (bot removed from server)
client.on(Events.GuildDelete, async (guild) => {
  console.log(`Left guild: ${guild.name} (${guild.id})`);

  // Mark guild as inactive in database
  try {
    await supabase
      .from('discord_guilds')
      .update({ is_active: false })
      .eq('guild_id', guild.id);
  } catch (err) {
    console.error('Error updating guild status:', err);
  }
});

// Error handling
client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down MAMA Bot...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down MAMA Bot...');
  client.destroy();
  process.exit(0);
});

// Login to Discord
console.log('Starting MAMA Discord Bot...');
client.login(process.env.DISCORD_BOT_TOKEN);
