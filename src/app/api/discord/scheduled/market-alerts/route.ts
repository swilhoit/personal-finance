/**
 * Market Alerts - Cron Job Endpoint
 * Checks watchlist price targets and sends alerts to Discord
 * 
 * Triggered by Vercel Cron: 0 * * * 1-5 (hourly on weekdays during market hours)
 */

import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { DiscordService } from '@/services/discordService';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST() {
  const startTime = Date.now();
  const admin = createSupabaseAdminClient();
  
  const alertsSent: Array<{
    user_id: string;
    symbol: string;
    alert_type: 'price_above' | 'price_below' | 'significant_move';
    price: number;
    success: boolean;
  }> = [];

  try {
    // Get all users with enabled market_alert schedules
    const { data: schedules, error: scheduleError } = await admin
      .from('notification_schedules')
      .select(`
        id,
        user_id,
        discord_guild_id,
        discord_channel_id,
        settings
      `)
      .eq('schedule_type', 'market_alert')
      .eq('is_enabled', true);

    if (scheduleError) {
      console.error('[Market Alerts] Failed to fetch schedules:', scheduleError);
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active market alert schedules',
        stats: { users_checked: 0, alerts_sent: 0 },
      });
    }

    console.log(`[Market Alerts] Checking ${schedules.length} users...`);

    // Get latest market data
    const today = new Date().toISOString().split('T')[0];
    const { data: marketData } = await admin
      .from('market_data')
      .select('symbol, name, price, change_percent')
      .eq('date', today);

    const priceMap = new Map<string, { price: number; change: number; name: string }>();
    for (const md of marketData || []) {
      priceMap.set(md.symbol, {
        price: Number(md.price),
        change: Number(md.change_percent || 0),
        name: md.name,
      });
    }

    for (const schedule of schedules) {
      try {
        // Get user's watchlist with alerts enabled
        const { data: watchlist } = await admin
          .from('user_watchlists')
          .select('symbol, alert_above, alert_below, alerts_enabled')
          .eq('user_id', schedule.user_id)
          .eq('alerts_enabled', true);

        if (!watchlist || watchlist.length === 0) {
          continue;
        }

        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
        if (!webhookUrl) continue;

        const discordService = new DiscordService(admin, { webhookUrl });

        // Check each watchlist item
        for (const item of watchlist) {
          const marketInfo = priceMap.get(item.symbol);
          if (!marketInfo) continue;

          let alertType: 'price_above' | 'price_below' | 'significant_move' | null = null;

          // Check price above target
          if (item.alert_above && marketInfo.price >= Number(item.alert_above)) {
            alertType = 'price_above';
          }
          // Check price below target
          else if (item.alert_below && marketInfo.price <= Number(item.alert_below)) {
            alertType = 'price_below';
          }
          // Check significant move (>5% change)
          else if (Math.abs(marketInfo.change) >= 5) {
            alertType = 'significant_move';
          }

          if (alertType) {
            const sent = await discordService.sendMarketAlert(
              item.symbol,
              marketInfo.name,
              marketInfo.price,
              marketInfo.change,
              alertType
            );

            if (sent) {
              await discordService.logNotification(
                schedule.user_id,
                schedule.discord_guild_id || '',
                schedule.discord_channel_id || '',
                'market_alert',
                `${item.symbol} Alert`,
                `Price: $${marketInfo.price.toFixed(2)} (${marketInfo.change >= 0 ? '+' : ''}${marketInfo.change.toFixed(2)}%)`,
                { symbol: item.symbol, price: marketInfo.price, alertType }
              );

              alertsSent.push({
                user_id: schedule.user_id,
                symbol: item.symbol,
                alert_type: alertType,
                price: marketInfo.price,
                success: true,
              });

              // Optionally disable alert after triggering to prevent spam
              // await admin
              //   .from('user_watchlists')
              //   .update({ alerts_enabled: false })
              //   .eq('user_id', schedule.user_id)
              //   .eq('symbol', item.symbol);
            }
          }
        }

        // Update last run
        await admin
          .from('notification_schedules')
          .update({ last_run_at: new Date().toISOString() })
          .eq('id', schedule.id);

        // Log run
        await admin.from('notification_schedule_runs').insert({
          schedule_id: schedule.id,
          user_id: schedule.user_id,
          status: 'completed',
          completed_at: new Date().toISOString(),
          result: { watchlist_checked: watchlist.length },
          notifications_sent: alertsSent.filter(a => a.user_id === schedule.user_id).length,
        });

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Market Alerts] Error for user ${schedule.user_id}:`, errorMessage);

        await admin.from('notification_schedule_runs').insert({
          schedule_id: schedule.id,
          user_id: schedule.user_id,
          status: 'failed',
          completed_at: new Date().toISOString(),
          error: errorMessage,
        });
      }
    }

    const stats = {
      users_checked: schedules.length,
      alerts_sent: alertsSent.length,
      duration_ms: Date.now() - startTime,
    };

    console.log('[Market Alerts] Complete:', stats);

    return NextResponse.json({
      success: true,
      stats,
      alerts: alertsSent,
    });

  } catch (error) {
    console.error('[Market Alerts] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to check market alerts' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}

