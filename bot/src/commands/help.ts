/**
 * /help command - Show available commands
 */

import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { SupabaseClient } from '@supabase/supabase-js';

export const helpCommand = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Show available MAMA bot commands')
  .toJSON();

export async function handleHelp(
  interaction: ChatInputCommandInteraction,
  _supabase: SupabaseClient
): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle('🤖 MAMA Bot Commands')
    .setDescription('Your personal finance assistant on Discord')
    .setColor(0x10B981)
    .addFields(
      {
        name: '💰 /balance',
        value: 'Show your connected bank account balances',
        inline: false,
      },
      {
        name: '💳 /spending [days]',
        value: 'View your spending breakdown by category\n`days`: Number of days to analyze (1-90, default: 7)',
        inline: false,
      },
      {
        name: '📊 /watchlist',
        value: 'View your stock watchlist with current prices and alerts',
        inline: false,
      },
      {
        name: '📈 /quote <symbol>',
        value: 'Get a quick stock quote\n`symbol`: Stock ticker (e.g., AAPL, MSFT)',
        inline: false,
      },
      {
        name: '❓ /help',
        value: 'Show this help message',
        inline: false,
      },
    )
    .addFields({
      name: '📢 Scheduled Notifications',
      value:
        '• **Weekly Report**: Financial summary every Sunday\n' +
        '• **Budget Alerts**: Daily alerts when you exceed budget thresholds\n' +
        '• **Market Alerts**: Watchlist price alerts during market hours\n\n' +
        'Configure notifications in the MAMA dashboard.',
      inline: false,
    })
    .setFooter({ text: 'MAMA - Your Personal Finance Agent' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
