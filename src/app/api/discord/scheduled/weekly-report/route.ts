/**
 * Weekly Discord Report - Cron Job Endpoint
 * Sends weekly financial summaries to users with Discord connected
 * 
 * Triggered by Vercel Cron: 0 10 * * 0 (Sundays at 10am UTC)
 */

import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { DiscordService } from '@/services/discordService';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface WeeklyData {
  totalSpent: number;
  totalIncome: number;
  topCategories: { name: string; amount: number }[];
  transactionCount: number;
}

export async function POST() {
  const startTime = Date.now();
  const admin = createSupabaseAdminClient();
  
  const results: Array<{
    user_id: string;
    guild_name: string;
    success: boolean;
    error?: string;
  }> = [];

  try {
    // Get all users with enabled weekly_report schedules
    const { data: schedules, error: scheduleError } = await admin
      .from('notification_schedules')
      .select(`
        id,
        user_id,
        discord_guild_id,
        discord_channel_id,
        settings,
        discord_guilds!inner (
          guild_id,
          guild_name,
          notification_channel_id,
          is_active
        )
      `)
      .eq('schedule_type', 'weekly_report')
      .eq('is_enabled', true);

    if (scheduleError) {
      console.error('[Weekly Report] Failed to fetch schedules:', scheduleError);
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active weekly report schedules',
        stats: { total: 0, sent: 0 },
      });
    }

    console.log(`[Weekly Report] Processing ${schedules.length} schedules...`);

    // Calculate week range
    const weekEnd = new Date();
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    for (const schedule of schedules) {
      const runStartTime = Date.now();
      
      try {
        // Get user's weekly transaction data
        const weeklyData = await getWeeklyData(admin, schedule.user_id, weekStartStr, weekEndStr);
        
        // Get Discord webhook URL from guild settings or use a configured webhook
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
        
        if (!webhookUrl) {
          throw new Error('No Discord webhook configured');
        }

        const discordService = new DiscordService(admin, { webhookUrl });
        
        // Send the weekly report
        const sent = await discordService.sendWeeklyReport({
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
          totalSpent: weeklyData.totalSpent,
          totalIncome: weeklyData.totalIncome,
          topCategories: weeklyData.topCategories,
        });

        if (sent) {
          // Log the notification
          await discordService.logNotification(
            schedule.user_id,
            schedule.discord_guild_id || '',
            schedule.discord_channel_id || '',
            'weekly_report',
            'Weekly Financial Report',
            `Week of ${weekStartStr} to ${weekEndStr}`,
            { weeklyData }
          );

          // Update schedule last_run
          await admin
            .from('notification_schedules')
            .update({ last_run_at: new Date().toISOString() })
            .eq('id', schedule.id);

          // Log run history
          await admin.from('notification_schedule_runs').insert({
            schedule_id: schedule.id,
            user_id: schedule.user_id,
            status: 'completed',
            completed_at: new Date().toISOString(),
            result: { weeklyData, sent: true },
            duration_ms: Date.now() - runStartTime,
            notifications_sent: 1,
          });

          const guildData = schedule.discord_guilds as { guild_name?: string } | null;
          results.push({
            user_id: schedule.user_id,
            guild_name: guildData?.guild_name || 'Unknown',
            success: true,
          });
        } else {
          throw new Error('Failed to send Discord message');
        }

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Weekly Report] Error for user ${schedule.user_id}:`, errorMessage);

        // Log failed run
        await admin.from('notification_schedule_runs').insert({
          schedule_id: schedule.id,
          user_id: schedule.user_id,
          status: 'failed',
          completed_at: new Date().toISOString(),
          error: errorMessage,
          duration_ms: Date.now() - runStartTime,
        });

        const guildData = schedule.discord_guilds as { guild_name?: string } | null;
        results.push({
          user_id: schedule.user_id,
          guild_name: guildData?.guild_name || 'Unknown',
          success: false,
          error: errorMessage,
        });
      }
    }

    const stats = {
      total: results.length,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      duration_ms: Date.now() - startTime,
    };

    console.log('[Weekly Report] Complete:', stats);

    return NextResponse.json({
      success: true,
      stats,
      results,
    });

  } catch (error) {
    console.error('[Weekly Report] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to send weekly reports' },
      { status: 500 }
    );
  }
}

async function getWeeklyData(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  weekStart: string,
  weekEnd: string
): Promise<WeeklyData> {
  // Get transactions for the week
  const { data: transactions } = await admin
    .from('transactions')
    .select('amount, category, merchant_name')
    .eq('user_id', userId)
    .gte('date', weekStart)
    .lte('date', weekEnd);

  if (!transactions || transactions.length === 0) {
    return {
      totalSpent: 0,
      totalIncome: 0,
      topCategories: [],
      transactionCount: 0,
    };
  }

  // Calculate totals
  let totalSpent = 0;
  let totalIncome = 0;
  const categoryTotals = new Map<string, number>();

  for (const tx of transactions) {
    const amount = Number(tx.amount);
    if (amount < 0) {
      totalSpent += Math.abs(amount);
      const category = tx.category || 'Uncategorized';
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + Math.abs(amount));
    } else {
      totalIncome += amount;
    }
  }

  // Get top 5 categories by spending
  const topCategories = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }));

  return {
    totalSpent,
    totalIncome,
    topCategories,
    transactionCount: transactions.length,
  };
}

export async function GET() {
  return POST();
}

