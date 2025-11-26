/**
 * /watchlist command - Show market watchlist
 */

import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveUser } from '../utils';

export const watchlistCommand = new SlashCommandBuilder()
  .setName('watchlist')
  .setDescription('Show your stock watchlist with current prices')
  .toJSON();

export async function handleWatchlist(
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

  const { data: watchlist } = await supabase
    .from('user_watchlists')
    .select('symbol, target_price_above, target_price_below')
    .eq('user_id', userId);

  if (!watchlist || watchlist.length === 0) {
    await interaction.editReply({
      content: '📈 Your watchlist is empty. Add stocks via the MAMA dashboard.',
    });
    return;
  }

  const symbols = watchlist.map(w => w.symbol);

  // Get latest market data
  const { data: marketData } = await supabase
    .from('market_data')
    .select('symbol, name, price, change_percent, performance_30d')
    .in('symbol', symbols);

  const embed = new EmbedBuilder()
    .setTitle('📊 Your Watchlist')
    .setColor(0x5865F2)
    .setTimestamp();

  const stockLines: string[] = [];

  for (const item of watchlist) {
    const data = marketData?.find(m => m.symbol === item.symbol);

    if (!data) {
      stockLines.push(`**${item.symbol}** - No data available`);
      continue;
    }

    const emoji = (data.change_percent || 0) >= 0 ? '📈' : '📉';
    const changeSign = (data.change_percent || 0) >= 0 ? '+' : '';
    const change30dSign = (data.performance_30d || 0) >= 0 ? '+' : '';

    let alertIndicator = '';
    if (item.target_price_above && data.price >= item.target_price_above) {
      alertIndicator = ' 🔔 Above target!';
    } else if (item.target_price_below && data.price <= item.target_price_below) {
      alertIndicator = ' 🔔 Below target!';
    }

    stockLines.push(
      `${emoji} **${item.symbol}** - ${data.name || 'Unknown'}\n` +
      `   Price: **$${(data.price || 0).toFixed(2)}** (${changeSign}${(data.change_percent || 0).toFixed(2)}%)\n` +
      `   30D: ${change30dSign}${(data.performance_30d || 0).toFixed(2)}%${alertIndicator}`
    );
  }

  embed.setDescription(stockLines.join('\n\n'));

  await interaction.editReply({ embeds: [embed] });
}
