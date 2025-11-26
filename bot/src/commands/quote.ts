/**
 * /quote command - Get stock quote
 */

import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { SupabaseClient } from '@supabase/supabase-js';

export const quoteCommand = new SlashCommandBuilder()
  .setName('quote')
  .setDescription('Get a stock quote')
  .addStringOption(option =>
    option
      .setName('symbol')
      .setDescription('Stock symbol (e.g., AAPL, MSFT)')
      .setRequired(true)
  )
  .toJSON();

export async function handleQuote(
  interaction: ChatInputCommandInteraction,
  supabase: SupabaseClient
): Promise<void> {
  await interaction.deferReply();

  const symbol = interaction.options.getString('symbol', true).toUpperCase();

  const { data } = await supabase
    .from('market_data')
    .select('*')
    .eq('symbol', symbol)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (!data) {
    await interaction.editReply({
      content: `❌ No data found for **${symbol}**. Try a different symbol.`,
    });
    return;
  }

  const isUp = (data.change_percent || 0) >= 0;
  const emoji = isUp ? '📈' : '📉';
  const color = isUp ? 0x57F287 : 0xED4245;
  const changeSign = isUp ? '+' : '';

  const embed = new EmbedBuilder()
    .setTitle(`${emoji} ${symbol}`)
    .setDescription(data.name || 'Unknown Company')
    .setColor(color)
    .addFields(
      { name: '💵 Price', value: `**$${(data.price || 0).toFixed(2)}**`, inline: true },
      { name: '📊 Change', value: `${changeSign}${(data.change_percent || 0).toFixed(2)}%`, inline: true },
      { name: '📅 30 Day', value: `${(data.performance_30d || 0) >= 0 ? '+' : ''}${(data.performance_30d || 0).toFixed(2)}%`, inline: true },
    )
    .setTimestamp();

  if (data.high && data.low) {
    embed.addFields(
      { name: '⬆️ High', value: `$${data.high.toFixed(2)}`, inline: true },
      { name: '⬇️ Low', value: `$${data.low.toFixed(2)}`, inline: true },
      { name: '📊 Volume', value: data.volume ? data.volume.toLocaleString() : 'N/A', inline: true },
    );
  }

  await interaction.editReply({ embeds: [embed] });
}
