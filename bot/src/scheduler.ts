/**
 * Scheduled task runner for Discord notifications
 * Uses node-cron to run periodic tasks
 */

import * as cron from 'node-cron';
import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Discord colors
const Colors = {
  Blue: 0x5865F2,
  Green: 0x57F287,
  Yellow: 0xFEE75C,
  Red: 0xED4245,
  Orange: 0xF59E0B,
  Purple: 0x9B59B6,
  Gold: 0xF1C40F,
};

/**
 * Start all scheduled tasks
 */
export function startScheduler(client: Client, supabase: SupabaseClient): void {
  console.log('Starting scheduled task runner...');

  // Weekly financial report - Sundays at 2 PM UTC
  cron.schedule('0 14 * * 0', async () => {
    console.log('[Scheduler] Running weekly report...');
    await sendWeeklyReports(client, supabase);
  });

  // Budget alerts - Daily at 1 PM UTC
  cron.schedule('0 13 * * *', async () => {
    console.log('[Scheduler] Running budget alerts...');
    await sendBudgetAlerts(client, supabase);
  });

  // Market alerts - Weekdays, every hour from 2 PM to 9 PM UTC (market hours)
  cron.schedule('0 14-21 * * 1-5', async () => {
    console.log('[Scheduler] Running market alerts...');
    await sendMarketAlerts(client, supabase);
  });

  console.log('Scheduled tasks registered:');
  console.log('  - Weekly report: Sundays at 2 PM UTC');
  console.log('  - Budget alerts: Daily at 1 PM UTC');
  console.log('  - Market alerts: Weekdays, 2-9 PM UTC (hourly)');
}

/**
 * Send weekly financial reports
 */
async function sendWeeklyReports(client: Client, supabase: SupabaseClient): Promise<void> {
  try {
    // Get all users with enabled weekly report schedules
    const { data: schedules } = await supabase
      .from('notification_schedules')
      .select('user_id, discord_guild_id, discord_channel_id, settings')
      .eq('schedule_type', 'weekly_report')
      .eq('is_enabled', true);

    if (!schedules || schedules.length === 0) {
      console.log('[Weekly Report] No active schedules found');
      return;
    }

    const weekEnd = new Date();
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    for (const schedule of schedules) {
      try {
        // Get user's transactions for the week
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount, category')
          .eq('user_id', schedule.user_id)
          .gte('date', weekStartStr);

        if (!transactions) continue;

        const income = transactions
          .filter(t => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0);

        const spending = transactions
          .filter(t => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        // Group spending by category
        const byCategory = new Map<string, number>();
        for (const tx of transactions.filter(t => t.amount < 0)) {
          const cat = tx.category || 'Uncategorized';
          byCategory.set(cat, (byCategory.get(cat) || 0) + Math.abs(tx.amount));
        }

        const topCategories = Array.from(byCategory.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        // Build embed
        const netFlow = income - spending;
        const netEmoji = netFlow >= 0 ? '✅' : '⚠️';

        const embed = new EmbedBuilder()
          .setTitle('📊 Weekly Financial Report')
          .setDescription(`**${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}**`)
          .setColor(Colors.Blue)
          .addFields(
            { name: '💰 Income', value: `$${income.toFixed(2)}`, inline: true },
            { name: '💳 Spending', value: `$${spending.toFixed(2)}`, inline: true },
            { name: `${netEmoji} Net`, value: `$${netFlow.toFixed(2)}`, inline: true },
          )
          .setTimestamp();

        if (topCategories.length > 0) {
          const categoryText = topCategories
            .map((c, i) => `${i + 1}. ${c[0]}: $${c[1].toFixed(2)}`)
            .join('\n');
          embed.addFields({ name: '📁 Top Spending Categories', value: categoryText, inline: false });
        }

        // Send to Discord channel
        await sendToChannel(client, schedule.discord_channel_id, { embeds: [embed] });

        // Log notification
        await supabase.from('discord_notifications').insert({
          user_id: schedule.user_id,
          guild_id: schedule.discord_guild_id,
          channel_id: schedule.discord_channel_id,
          notification_type: 'weekly_report',
          title: 'Weekly Financial Report',
          message: `Income: $${income.toFixed(2)}, Spending: $${spending.toFixed(2)}`,
          delivered: true,
        });

        // Update schedule last run
        await supabase
          .from('notification_schedules')
          .update({ last_run_at: new Date().toISOString() })
          .eq('user_id', schedule.user_id)
          .eq('schedule_type', 'weekly_report');

      } catch (err) {
        console.error(`[Weekly Report] Error for user ${schedule.user_id}:`, err);
      }
    }

    console.log(`[Weekly Report] Sent ${schedules.length} reports`);
  } catch (err) {
    console.error('[Weekly Report] Error:', err);
  }
}

/**
 * Send budget alerts for users exceeding thresholds
 */
async function sendBudgetAlerts(client: Client, supabase: SupabaseClient): Promise<void> {
  try {
    // Get users with budget alert schedules enabled
    const { data: schedules } = await supabase
      .from('notification_schedules')
      .select('user_id, discord_guild_id, discord_channel_id, settings')
      .eq('schedule_type', 'budget_alert')
      .eq('is_enabled', true);

    if (!schedules || schedules.length === 0) {
      console.log('[Budget Alerts] No active schedules found');
      return;
    }

    const currentMonth = new Date().toISOString().slice(0, 7);

    for (const schedule of schedules) {
      try {
        const threshold = (schedule.settings as { threshold?: number })?.threshold || 80;

        // Get user's budgets for current month
        const { data: budgets } = await supabase
          .from('budgets')
          .select('id, amount, category_id, categories(name)')
          .eq('user_id', schedule.user_id)
          .eq('month', currentMonth);

        if (!budgets || budgets.length === 0) continue;

        // Get month's spending by category
        const monthStart = `${currentMonth}-01`;
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount, category_id')
          .eq('user_id', schedule.user_id)
          .gte('date', monthStart)
          .lt('amount', 0);

        if (!transactions) continue;

        // Calculate spending by category
        const spendingByCategory = new Map<string, number>();
        for (const tx of transactions) {
          const catId = tx.category_id || 'uncategorized';
          spendingByCategory.set(catId, (spendingByCategory.get(catId) || 0) + Math.abs(tx.amount));
        }

        // Check each budget
        const alerts: { category: string; spent: number; budget: number; percent: number }[] = [];

        for (const budget of budgets) {
          const spent = spendingByCategory.get(budget.category_id) || 0;
          const percent = (spent / budget.amount) * 100;

          if (percent >= threshold) {
            // Handle the categories field which could be an array or object
            const categories = budget.categories;
            let categoryName = 'Unknown';
            if (Array.isArray(categories) && categories[0]?.name) {
              categoryName = categories[0].name;
            } else if (categories && typeof categories === 'object' && 'name' in categories) {
              categoryName = (categories as { name: string }).name;
            }

            alerts.push({
              category: categoryName,
              spent,
              budget: budget.amount,
              percent,
            });
          }
        }

        if (alerts.length === 0) continue;

        // Build and send embed
        for (const alert of alerts) {
          const emoji = alert.percent >= 100 ? '🚨' : '⚠️';
          const color = alert.percent >= 100 ? Colors.Red : Colors.Orange;

          const embed = new EmbedBuilder()
            .setTitle(`${emoji} Budget Alert: ${alert.category}`)
            .setDescription(`You've spent **${alert.percent.toFixed(0)}%** of your ${alert.category} budget.`)
            .setColor(color)
            .addFields(
              { name: 'Spent', value: `$${alert.spent.toFixed(2)}`, inline: true },
              { name: 'Budget', value: `$${alert.budget.toFixed(2)}`, inline: true },
              { name: 'Remaining', value: `$${Math.max(0, alert.budget - alert.spent).toFixed(2)}`, inline: true },
            )
            .setTimestamp();

          await sendToChannel(client, schedule.discord_channel_id, { embeds: [embed] });

          // Log notification
          await supabase.from('discord_notifications').insert({
            user_id: schedule.user_id,
            guild_id: schedule.discord_guild_id,
            channel_id: schedule.discord_channel_id,
            notification_type: 'budget_alert',
            title: `Budget Alert: ${alert.category}`,
            message: `${alert.percent.toFixed(0)}% of budget used`,
            delivered: true,
          });
        }

        // Update schedule last run
        await supabase
          .from('notification_schedules')
          .update({ last_run_at: new Date().toISOString() })
          .eq('user_id', schedule.user_id)
          .eq('schedule_type', 'budget_alert');

      } catch (err) {
        console.error(`[Budget Alerts] Error for user ${schedule.user_id}:`, err);
      }
    }

    console.log(`[Budget Alerts] Processed ${schedules.length} users`);
  } catch (err) {
    console.error('[Budget Alerts] Error:', err);
  }
}

/**
 * Send market alerts for watchlist price targets
 */
async function sendMarketAlerts(client: Client, supabase: SupabaseClient): Promise<void> {
  try {
    // Get users with market alert schedules enabled
    const { data: schedules } = await supabase
      .from('notification_schedules')
      .select('user_id, discord_guild_id, discord_channel_id, settings')
      .eq('schedule_type', 'market_alert')
      .eq('is_enabled', true);

    if (!schedules || schedules.length === 0) {
      console.log('[Market Alerts] No active schedules found');
      return;
    }

    for (const schedule of schedules) {
      try {
        // Get user's watchlist with targets
        const { data: watchlist } = await supabase
          .from('user_watchlists')
          .select('symbol, target_price_above, target_price_below, last_alert_price')
          .eq('user_id', schedule.user_id);

        if (!watchlist || watchlist.length === 0) continue;

        const symbols = watchlist.map(w => w.symbol);

        // Get current market data
        const { data: marketData } = await supabase
          .from('market_data')
          .select('symbol, name, price, change_percent')
          .in('symbol', symbols);

        if (!marketData) continue;

        for (const item of watchlist) {
          const data = marketData.find(m => m.symbol === item.symbol);
          if (!data || !data.price) continue;

          let alertType: 'price_above' | 'price_below' | 'significant_move' | null = null;
          let alertReason = '';

          // Check price targets
          if (item.target_price_above && data.price >= item.target_price_above) {
            // Only alert if price wasn't already above target
            if (!item.last_alert_price || item.last_alert_price < item.target_price_above) {
              alertType = 'price_above';
              alertReason = `risen above your target of $${item.target_price_above}`;
            }
          } else if (item.target_price_below && data.price <= item.target_price_below) {
            if (!item.last_alert_price || item.last_alert_price > item.target_price_below) {
              alertType = 'price_below';
              alertReason = `dropped below your target of $${item.target_price_below}`;
            }
          }

          // Check significant moves (>5%)
          if (!alertType && Math.abs(data.change_percent || 0) >= 5) {
            alertType = 'significant_move';
            alertReason = `moved ${(data.change_percent || 0) >= 0 ? 'up' : 'down'} ${Math.abs(data.change_percent || 0).toFixed(1)}% today`;
          }

          if (!alertType) continue;

          const isUp = (data.change_percent || 0) >= 0;
          const emoji = isUp ? '📈' : '📉';
          const color = isUp ? Colors.Green : Colors.Red;

          const embed = new EmbedBuilder()
            .setTitle(`${emoji} ${item.symbol} Alert`)
            .setDescription(`**${data.name || item.symbol}** has ${alertReason}!`)
            .setColor(color)
            .addFields(
              { name: 'Price', value: `$${data.price.toFixed(2)}`, inline: true },
              { name: 'Change', value: `${isUp ? '+' : ''}${(data.change_percent || 0).toFixed(2)}%`, inline: true },
            )
            .setTimestamp();

          await sendToChannel(client, schedule.discord_channel_id, { embeds: [embed] });

          // Update last alert price
          await supabase
            .from('user_watchlists')
            .update({ last_alert_price: data.price })
            .eq('user_id', schedule.user_id)
            .eq('symbol', item.symbol);

          // Log notification
          await supabase.from('discord_notifications').insert({
            user_id: schedule.user_id,
            guild_id: schedule.discord_guild_id,
            channel_id: schedule.discord_channel_id,
            notification_type: 'market_alert',
            title: `${item.symbol} Alert`,
            message: alertReason,
            delivered: true,
          });
        }

        // Update schedule last run
        await supabase
          .from('notification_schedules')
          .update({ last_run_at: new Date().toISOString() })
          .eq('user_id', schedule.user_id)
          .eq('schedule_type', 'market_alert');

      } catch (err) {
        console.error(`[Market Alerts] Error for user ${schedule.user_id}:`, err);
      }
    }

    console.log(`[Market Alerts] Processed ${schedules.length} users`);
  } catch (err) {
    console.error('[Market Alerts] Error:', err);
  }
}

/**
 * Send message to a Discord channel
 */
async function sendToChannel(
  client: Client,
  channelId: string,
  message: { embeds: EmbedBuilder[] }
): Promise<boolean> {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) {
      console.error(`[Scheduler] Channel ${channelId} not found or not text-based`);
      return false;
    }

    await (channel as TextChannel).send(message);
    return true;
  } catch (err) {
    console.error(`[Scheduler] Error sending to channel ${channelId}:`, err);
    return false;
  }
}
