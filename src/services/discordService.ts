/**
 * Discord Service
 * Handles Discord bot operations and webhook notifications
 */

import type { SupabaseClient } from '@supabase/supabase-js';

interface DiscordGuild {
  id: string;
  user_id: string;
  guild_id: string;
  guild_name: string;
  is_active: boolean;
  settings?: Record<string, unknown>;
  notification_channel_id?: string;
  finance_channel_id?: string;
  registered_at: string;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
  thumbnail?: { url: string };
  image?: { url: string };
}

export interface DiscordWebhookMessage {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

// Discord colors
export const DiscordColors = {
  Blue: 0x5865F2,
  Green: 0x57F287,
  Yellow: 0xFEE75C,
  Red: 0xED4245,
  Orange: 0xF59E0B,
  Purple: 0x9B59B6,
  Gold: 0xF1C40F,
};

export class DiscordService {
  private supabase: SupabaseClient;
  private botToken?: string;
  private webhookUrl?: string;

  constructor(
    supabase: SupabaseClient,
    options?: { botToken?: string; webhookUrl?: string }
  ) {
    this.supabase = supabase;
    this.botToken = options?.botToken;
    this.webhookUrl = options?.webhookUrl;
  }

  /**
   * Send a message via webhook (simple notifications)
   */
  async sendWebhook(message: DiscordWebhookMessage): Promise<boolean> {
    if (!this.webhookUrl) {
      console.warn('No Discord webhook URL configured');
      return false;
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending Discord webhook:', error);
      return false;
    }
  }

  /**
   * Send a simple alert
   */
  async sendAlert(
    title: string,
    message: string,
    color: number = DiscordColors.Blue
  ): Promise<boolean> {
    return this.sendWebhook({
      embeds: [{
        title,
        description: message,
        color,
        timestamp: new Date().toISOString(),
      }],
    });
  }

  /**
   * Send a budget alert
   */
  async sendBudgetAlert(
    category: string,
    spent: number,
    limit: number,
    _currency: string = 'USD'
  ): Promise<boolean> {
    const percent = (spent / limit) * 100;
    const color = percent >= 100 ? DiscordColors.Red : 
                  percent >= 80 ? DiscordColors.Orange : 
                  DiscordColors.Green;

    const emoji = percent >= 100 ? '🚨' : percent >= 80 ? '⚠️' : '💰';

    return this.sendWebhook({
      embeds: [{
        title: `${emoji} Budget Alert: ${category}`,
        description: `You've spent **${percent.toFixed(0)}%** of your ${category} budget.`,
        color,
        fields: [
          { name: 'Spent', value: `$${spent.toFixed(2)}`, inline: true },
          { name: 'Budget', value: `$${limit.toFixed(2)}`, inline: true },
          { name: 'Remaining', value: `$${Math.max(0, limit - spent).toFixed(2)}`, inline: true },
        ],
        timestamp: new Date().toISOString(),
      }],
    });
  }

  /**
   * Send a market alert
   */
  async sendMarketAlert(
    symbol: string,
    name: string,
    price: number,
    changePercent: number,
    alertType: 'price_above' | 'price_below' | 'significant_move'
  ): Promise<boolean> {
    const isUp = changePercent >= 0;
    const emoji = isUp ? '📈' : '📉';
    const color = isUp ? DiscordColors.Green : DiscordColors.Red;

    const alertMessages = {
      price_above: `${symbol} has risen above your target price!`,
      price_below: `${symbol} has dropped below your target price!`,
      significant_move: `${symbol} has made a significant move today.`,
    };

    return this.sendWebhook({
      embeds: [{
        title: `${emoji} ${symbol} Alert`,
        description: alertMessages[alertType],
        color,
        fields: [
          { name: 'Price', value: `$${price.toFixed(2)}`, inline: true },
          { name: 'Change', value: `${isUp ? '+' : ''}${changePercent.toFixed(2)}%`, inline: true },
          { name: 'Name', value: name, inline: true },
        ],
        timestamp: new Date().toISOString(),
      }],
    });
  }

  /**
   * Send a transaction alert
   */
  async sendTransactionAlert(
    merchant: string,
    amount: number,
    category: string,
    accountName: string
  ): Promise<boolean> {
    const isExpense = amount < 0;
    const emoji = isExpense ? '💳' : '💵';
    const color = isExpense ? DiscordColors.Orange : DiscordColors.Green;

    return this.sendWebhook({
      embeds: [{
        title: `${emoji} New Transaction`,
        color,
        fields: [
          { name: 'Merchant', value: merchant, inline: true },
          { name: 'Amount', value: `$${Math.abs(amount).toFixed(2)}`, inline: true },
          { name: 'Category', value: category, inline: true },
          { name: 'Account', value: accountName, inline: false },
        ],
        timestamp: new Date().toISOString(),
      }],
    });
  }

  /**
   * Send a weekly report
   */
  async sendWeeklyReport(report: {
    weekStart: string;
    weekEnd: string;
    totalSpent: number;
    totalIncome: number;
    topCategories: { name: string; amount: number }[];
    portfolioChange?: number;
    recommendations?: string[];
  }): Promise<boolean> {
    const netFlow = report.totalIncome - report.totalSpent;
    const netEmoji = netFlow >= 0 ? '✅' : '⚠️';

    const categoryText = report.topCategories
      .slice(0, 5)
      .map((c, i) => `${i + 1}. ${c.name}: $${c.amount.toFixed(2)}`)
      .join('\n');

    const embeds: DiscordEmbed[] = [
      {
        title: '📊 Weekly Financial Report',
        description: `**${report.weekStart} - ${report.weekEnd}**`,
        color: DiscordColors.Blue,
        fields: [
          { name: '💰 Income', value: `$${report.totalIncome.toFixed(2)}`, inline: true },
          { name: '💳 Spending', value: `$${report.totalSpent.toFixed(2)}`, inline: true },
          { name: `${netEmoji} Net`, value: `$${netFlow.toFixed(2)}`, inline: true },
        ],
        timestamp: new Date().toISOString(),
      },
      {
        title: '📁 Top Spending Categories',
        description: categoryText || 'No spending this week!',
        color: DiscordColors.Purple,
      },
    ];

    if (report.portfolioChange !== undefined) {
      const portfolioEmoji = report.portfolioChange >= 0 ? '📈' : '📉';
      embeds.push({
        title: `${portfolioEmoji} Portfolio Performance`,
        description: `Your portfolio is ${report.portfolioChange >= 0 ? 'up' : 'down'} **${Math.abs(report.portfolioChange).toFixed(2)}%** this week.`,
        color: report.portfolioChange >= 0 ? DiscordColors.Green : DiscordColors.Red,
      });
    }

    if (report.recommendations && report.recommendations.length > 0) {
      embeds.push({
        title: '💡 Recommendations',
        description: report.recommendations.map(r => `• ${r}`).join('\n'),
        color: DiscordColors.Gold,
      });
    }

    return this.sendWebhook({ embeds });
  }

  /**
   * Log notification to database
   */
  async logNotification(
    userId: string,
    guildId: string,
    channelId: string,
    type: 'budget_alert' | 'market_alert' | 'transaction' | 'weekly_report' | 'system',
    title: string,
    message: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.supabase.from('discord_notifications').insert({
        user_id: userId,
        guild_id: guildId,
        channel_id: channelId,
        notification_type: type,
        title,
        message,
        data,
        delivered: true,
      });
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  /**
   * Get user's Discord guild registration
   */
  async getUserGuild(userId: string): Promise<DiscordGuild | null> {
    const { data, error } = await this.supabase
      .from('discord_guilds')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  /**
   * Register a Discord guild for a user
   */
  async registerGuild(
    userId: string,
    guildId: string,
    guildName: string
  ): Promise<boolean> {
    const { error } = await this.supabase.from('discord_guilds').upsert({
      user_id: userId,
      guild_id: guildId,
      guild_name: guildName,
      is_active: true,
      registered_at: new Date().toISOString(),
    }, { onConflict: 'guild_id' });

    if (error) {
      console.error('Error registering guild:', error);
      return false;
    }

    return true;
  }

  /**
   * Resolve guild to user
   */
  async resolveGuildUser(guildId: string): Promise<{ userId: string; settings: Record<string, unknown> | null } | null> {
    const { data, error } = await this.supabase
      .from('discord_guilds')
      .select('user_id, settings')
      .eq('guild_id', guildId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      userId: data.user_id,
      settings: data.settings,
    };
  }
}

/**
 * Discord Bot for multi-tenant operation
 * This is a simplified version - full implementation would use discord.js
 */
export class DiscordBot {
  private token: string;
  private supabase: SupabaseClient;
  private discordService: DiscordService;

  constructor(token: string, supabase: SupabaseClient) {
    this.token = token;
    this.supabase = supabase;
    this.discordService = new DiscordService(supabase, { botToken: token });
  }

  /**
   * Get bot invite URL
   */
  getInviteUrl(clientId: string): string {
    const permissions = 3147776; // Send messages, embed links, read message history
    const scopes = 'bot%20applications.commands';
    return `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=${scopes}`;
  }

  /**
   * Start the bot (placeholder - full implementation would use discord.js)
   */
  async start(): Promise<void> {
    console.log('Discord bot starting...');
    console.log('Note: Full implementation requires discord.js client');
    // In full implementation:
    // const { Client, GatewayIntentBits } = await import('discord.js');
    // const client = new Client({ intents: [...] });
    // client.login(this.token);
  }
}





