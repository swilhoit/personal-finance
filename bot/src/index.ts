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
    GatewayIntentBits.MessageContent, // Required to read message content when tagged
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

// Handle ALL interactions (for debugging)
client.on(Events.InteractionCreate, async (interaction) => {
  console.log(`[Interaction] Type: ${interaction.type}, User: ${interaction.user.tag}, Guild: ${interaction.guildId}`);

  if (!interaction.isChatInputCommand()) {
    console.log(`[Interaction] Not a chat input command, skipping`);
    return;
  }

  console.log(`[Command] Received: /${interaction.commandName}`);
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

// Handle messages when bot is mentioned
client.on(Events.MessageCreate, async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Check if bot is mentioned
  if (!message.mentions.has(client.user!)) return;

  console.log(`[Message] Bot mentioned by ${message.author.tag}: ${message.content}`);

  // Remove the bot mention from the message
  const question = message.content
    .replace(/<@!?\d+>/g, '')
    .trim();

  if (!question) {
    await message.reply('Hi! Ask me about your finances. For example: "What\'s my balance?" or "How much did I spend this week?"');
    return;
  }

  // Show typing indicator
  await message.channel.sendTyping();

  try {
    // Resolve user from guild or Discord connection
    const guildId = message.guildId;
    let userId: string | null = null;

    if (guildId) {
      const { data: guildData } = await supabase
        .from('discord_guilds')
        .select('user_id')
        .eq('guild_id', guildId)
        .eq('is_active', true)
        .single();

      if (guildData?.user_id) {
        userId = guildData.user_id;
      }
    }

    // Fallback to Discord connection
    if (!userId) {
      const { data: connectionData } = await supabase
        .from('discord_connections')
        .select('user_id')
        .eq('discord_user_id', message.author.id)
        .eq('is_active', true)
        .single();

      userId = connectionData?.user_id || null;
    }

    if (!userId) {
      await message.reply('I don\'t recognize you yet! Please connect your Discord account in the MAMA dashboard first.');
      return;
    }

    // Get user's financial context
    const [accountsRes, transactionsRes] = await Promise.all([
      supabase
        .from('teller_accounts')
        .select('name, type, current_balance, institution_name')
        .eq('user_id', userId)
        .eq('is_active', true),
      supabase
        .from('transactions')
        .select('date, merchant_name, amount, category')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(20),
    ]);

    const accounts = accountsRes.data || [];
    const transactions = transactionsRes.data || [];

    // Build context for AI
    const totalBalance = accounts.reduce((sum, a) => sum + (a.current_balance || 0), 0);
    const recentSpending = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Simple response based on keywords (no external AI needed)
    let response = '';
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('balance') || lowerQuestion.includes('how much do i have')) {
      response = `💰 **Your Total Balance: $${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}**\n\n`;
      if (accounts.length > 0) {
        response += accounts.map(a =>
          `• ${a.name} (${a.institution_name}): $${(a.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        ).join('\n');
      } else {
        response += 'No accounts connected yet. Visit the MAMA dashboard to link your bank.';
      }
    } else if (lowerQuestion.includes('spend') || lowerQuestion.includes('spent')) {
      const weekSpending = transactions
        .filter(t => {
          const txDate = new Date(t.date);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return t.amount < 0 && txDate >= weekAgo;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      response = `💳 **Recent Spending**\n\n`;
      response += `• This week: **$${weekSpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}**\n`;
      response += `• Recent transactions: **$${recentSpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}**\n\n`;

      if (transactions.length > 0) {
        response += '**Latest transactions:**\n';
        response += transactions.slice(0, 5).map(t =>
          `• ${t.merchant_name || 'Transaction'}: $${Math.abs(t.amount).toFixed(2)} (${t.category || 'Uncategorized'})`
        ).join('\n');
      }
    } else if (lowerQuestion.includes('transaction') || lowerQuestion.includes('recent')) {
      response = `📋 **Recent Transactions**\n\n`;
      if (transactions.length > 0) {
        response += transactions.slice(0, 10).map(t =>
          `• ${t.date}: ${t.merchant_name || 'Transaction'} - $${Math.abs(t.amount).toFixed(2)}`
        ).join('\n');
      } else {
        response += 'No recent transactions found.';
      }
    } else if (lowerQuestion.includes('help') || lowerQuestion.includes('what can you do')) {
      response = `🤖 **I can help you with:**\n\n`;
      response += `• Check your **balance** - "What's my balance?"\n`;
      response += `• View **spending** - "How much did I spend this week?"\n`;
      response += `• See **transactions** - "Show me recent transactions"\n\n`;
      response += `You can also use slash commands: \`/balance\`, \`/spending\`, \`/watchlist\`, \`/quote\``;
    } else {
      // Default response with summary
      response = `📊 **Quick Summary**\n\n`;
      response += `• Total Balance: **$${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}**\n`;
      response += `• Recent Spending: **$${recentSpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}**\n`;
      response += `• Connected Accounts: **${accounts.length}**\n\n`;
      response += `Ask me about your balance, spending, or transactions! Or use \`/help\` for commands.`;
    }

    await message.reply(response);

  } catch (error) {
    console.error('[Message] Error handling message:', error);
    await message.reply('Sorry, I encountered an error. Please try again or use `/help` for available commands.');
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
