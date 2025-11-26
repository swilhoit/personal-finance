/**
 * /balance command - Show account balances
 */

import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveUser } from '../utils';

export const balanceCommand = new SlashCommandBuilder()
  .setName('balance')
  .setDescription('Show your connected account balances')
  .toJSON();

export async function handleBalance(
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

  const { data: accounts } = await supabase
    .from('teller_accounts')
    .select('name, type, current_balance, institution_name')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (!accounts || accounts.length === 0) {
    await interaction.editReply({
      content: '💳 No connected bank accounts. Visit the MAMA dashboard to connect your bank.',
    });
    return;
  }

  const total = accounts.reduce((sum, a) => sum + (a.current_balance || 0), 0);

  const embed = new EmbedBuilder()
    .setTitle('💰 Account Balances')
    .setColor(0x57F287)
    .setTimestamp();

  // Group accounts by type
  const checking = accounts.filter(a => a.type === 'depository' || a.type === 'checking');
  const savings = accounts.filter(a => a.type === 'savings');
  const credit = accounts.filter(a => a.type === 'credit');
  const other = accounts.filter(a => !['depository', 'checking', 'savings', 'credit'].includes(a.type));

  if (checking.length > 0) {
    embed.addFields({
      name: '🏦 Checking',
      value: checking.map(a => `**${a.name}**\n${a.institution_name}: $${(a.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`).join('\n\n'),
      inline: true,
    });
  }

  if (savings.length > 0) {
    embed.addFields({
      name: '💎 Savings',
      value: savings.map(a => `**${a.name}**\n${a.institution_name}: $${(a.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`).join('\n\n'),
      inline: true,
    });
  }

  if (credit.length > 0) {
    embed.addFields({
      name: '💳 Credit',
      value: credit.map(a => `**${a.name}**\n${a.institution_name}: $${(a.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`).join('\n\n'),
      inline: true,
    });
  }

  if (other.length > 0) {
    embed.addFields({
      name: '📊 Other',
      value: other.map(a => `**${a.name}**\n$${(a.current_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`).join('\n\n'),
      inline: true,
    });
  }

  embed.addFields({
    name: '💵 Total Balance',
    value: `**$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}**`,
    inline: false,
  });

  await interaction.editReply({ embeds: [embed] });
}
