/**
 * Register Discord slash commands
 * Run this once to register commands with Discord API
 *
 * Usage: npm run register-commands
 */

import { REST, Routes } from 'discord.js';
import * as dotenv from 'dotenv';

import { balanceCommand } from './commands/balance';
import { spendingCommand } from './commands/spending';
import { watchlistCommand } from './commands/watchlist';
import { quoteCommand } from './commands/quote';
import { helpCommand } from './commands/help';

dotenv.config();

const commands = [
  balanceCommand,
  spendingCommand,
  watchlistCommand,
  quoteCommand,
  helpCommand,
];

async function registerCommands() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token || !clientId) {
    console.error('Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID');
    process.exit(1);
  }

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log(`Registering ${commands.length} slash commands...`);

    // Register commands globally (takes up to 1 hour to propagate)
    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    ) as unknown[];

    console.log(`Successfully registered ${data.length} commands:`);
    commands.forEach(cmd => {
      const name = 'name' in cmd ? cmd.name : 'unknown';
      console.log(`  - /${name}`);
    });

    console.log('\nNote: Global commands may take up to 1 hour to appear in all servers.');
    console.log('For faster testing, use guild-specific commands.');

  } catch (error) {
    console.error('Error registering commands:', error);
    process.exit(1);
  }
}

// Option to register to a specific guild for faster testing
async function registerGuildCommands(guildId: string) {
  const token = process.env.DISCORD_BOT_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token || !clientId) {
    console.error('Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID');
    process.exit(1);
  }

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log(`Registering ${commands.length} slash commands to guild ${guildId}...`);

    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    ) as unknown[];

    console.log(`Successfully registered ${data.length} guild commands (instant)`);

  } catch (error) {
    console.error('Error registering guild commands:', error);
    process.exit(1);
  }
}

// Run
const guildId = process.argv[2];
if (guildId) {
  registerGuildCommands(guildId);
} else {
  registerCommands();
}
