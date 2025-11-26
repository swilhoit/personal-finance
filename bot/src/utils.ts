/**
 * Bot utility functions
 */

import { ChatInputCommandInteraction } from 'discord.js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Resolve the MAMA user ID from a Discord interaction
 * First checks guild registration, then falls back to direct Discord user connection
 */
export async function resolveUser(
  interaction: ChatInputCommandInteraction,
  supabase: SupabaseClient
): Promise<string | null> {
  const guildId = interaction.guildId;
  const discordUserId = interaction.user.id;

  // First, try to find by guild registration
  if (guildId) {
    const { data: guildData } = await supabase
      .from('discord_guilds')
      .select('user_id')
      .eq('guild_id', guildId)
      .eq('is_active', true)
      .single();

    if (guildData?.user_id) {
      return guildData.user_id;
    }
  }

  // Fall back to direct Discord user connection
  const { data: connectionData } = await supabase
    .from('discord_connections')
    .select('user_id')
    .eq('discord_user_id', discordUserId)
    .eq('is_active', true)
    .single();

  return connectionData?.user_id || null;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, showSign = true): string {
  const sign = showSign && value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Get emoji for value change
 */
export function getChangeEmoji(value: number): string {
  return value >= 0 ? '📈' : '📉';
}

/**
 * Get color for value change (Discord embed colors)
 */
export function getChangeColor(value: number): number {
  return value >= 0 ? 0x57F287 : 0xED4245; // Green or Red
}
