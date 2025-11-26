/**
 * /spending command - Show spending breakdown
 */

import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveUser } from '../utils';

export const spendingCommand = new SlashCommandBuilder()
  .setName('spending')
  .setDescription('Show your spending breakdown')
  .addIntegerOption(option =>
    option
      .setName('days')
      .setDescription('Number of days to look back (default: 7)')
      .setMinValue(1)
      .setMaxValue(90)
      .setRequired(false)
  )
  .toJSON();

export async function handleSpending(
  interaction: ChatInputCommandInteraction,
  supabase: SupabaseClient
): Promise<void> {
  await interaction.deferReply();

  const userId = await resolveUser(interaction, supabase);
  if (!userId) {
    await interaction.editReply({
      content: '❌ This server is not linked to a MAMA account. Please visit the dashboard to connect your Discord.',
    });
    return;
  }

  const days = interaction.options.getInteger('days') || 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, category, merchant_name, date')
    .eq('user_id', userId)
    .gte('date', since)
    .lt('amount', 0);

  if (!transactions || transactions.length === 0) {
    await interaction.editReply({
      content: `📊 No spending found in the last ${days} days.`,
    });
    return;
  }

  const total = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Group by category
  const byCategory = new Map<string, number>();
  for (const tx of transactions) {
    const cat = tx.category || 'Uncategorized';
    byCategory.set(cat, (byCategory.get(cat) || 0) + Math.abs(tx.amount));
  }

  const topCategories = Array.from(byCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Calculate percentages and create bar chart
  const categoryText = topCategories.map(([cat, amount]) => {
    const percent = (amount / total) * 100;
    const barLength = Math.round(percent / 5);
    const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
    return `${cat}\n${bar} $${amount.toFixed(0)} (${percent.toFixed(0)}%)`;
  }).join('\n\n');

  const embed = new EmbedBuilder()
    .setTitle(`💳 Spending (Last ${days} Days)`)
    .setColor(0xF59E0B)
    .addFields(
      { name: 'Total Spent', value: `**$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}**`, inline: true },
      { name: 'Transactions', value: `**${transactions.length}**`, inline: true },
      { name: 'Daily Average', value: `**$${(total / days).toFixed(2)}**`, inline: true },
    )
    .setDescription(`**By Category:**\n\n${categoryText}`)
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
