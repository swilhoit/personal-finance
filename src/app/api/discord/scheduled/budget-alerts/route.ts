/**
 * Budget Alerts - Cron Job Endpoint
 * Checks budget thresholds and sends alerts to Discord
 * 
 * Triggered by Vercel Cron: 0 5 * * * (daily at 5am UTC)
 */

import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { DiscordService } from '@/services/discordService';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

interface BudgetStatus {
  category_name: string;
  category_id: string;
  budget_amount: number;
  spent_amount: number;
  percent_used: number;
}

export async function POST() {
  const startTime = Date.now();
  const admin = createSupabaseAdminClient();
  
  const alertsSent: Array<{
    user_id: string;
    category: string;
    percent: number;
    success: boolean;
  }> = [];

  try {
    // Get all users with enabled budget_alert schedules
    const { data: schedules, error: scheduleError } = await admin
      .from('notification_schedules')
      .select(`
        id,
        user_id,
        discord_guild_id,
        discord_channel_id,
        settings
      `)
      .eq('schedule_type', 'budget_alert')
      .eq('is_enabled', true);

    if (scheduleError) {
      console.error('[Budget Alerts] Failed to fetch schedules:', scheduleError);
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active budget alert schedules',
        stats: { users_checked: 0, alerts_sent: 0 },
      });
    }

    console.log(`[Budget Alerts] Checking ${schedules.length} users...`);

    // Current month for budget lookup
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    for (const schedule of schedules) {
      try {
        // Get threshold from settings (default 80%)
        const settings = schedule.settings as { threshold_percent?: number } | null;
        const threshold = settings?.threshold_percent || 80;

        // Get user's budgets with spending
        const budgetStatuses = await getBudgetStatuses(admin, schedule.user_id, currentMonth);
        
        // Filter to budgets over threshold
        const alertableBudgets = budgetStatuses.filter(b => b.percent_used >= threshold);

        if (alertableBudgets.length === 0) {
          continue; // No alerts needed for this user
        }

        // Get Discord webhook
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
        if (!webhookUrl) continue;

        const discordService = new DiscordService(admin, { webhookUrl });

        // Send alerts for each budget over threshold
        for (const budget of alertableBudgets) {
          const sent = await discordService.sendBudgetAlert(
            budget.category_name,
            budget.spent_amount,
            budget.budget_amount,
            'USD'
          );

          if (sent) {
            await discordService.logNotification(
              schedule.user_id,
              schedule.discord_guild_id || '',
              schedule.discord_channel_id || '',
              'budget_alert',
              `Budget Alert: ${budget.category_name}`,
              `${budget.percent_used.toFixed(0)}% of budget used`,
              { budget }
            );

            alertsSent.push({
              user_id: schedule.user_id,
              category: budget.category_name,
              percent: budget.percent_used,
              success: true,
            });
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
          result: { budgets_checked: budgetStatuses.length, alerts_triggered: alertableBudgets.length },
          notifications_sent: alertableBudgets.length,
        });

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Budget Alerts] Error for user ${schedule.user_id}:`, errorMessage);

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

    console.log('[Budget Alerts] Complete:', stats);

    return NextResponse.json({
      success: true,
      stats,
      alerts: alertsSent,
    });

  } catch (error) {
    console.error('[Budget Alerts] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Failed to check budget alerts' },
      { status: 500 }
    );
  }
}

async function getBudgetStatuses(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  month: string
): Promise<BudgetStatus[]> {
  // Get user's budgets for this month
  const { data: budgets } = await admin
    .from('budgets')
    .select(`
      id,
      amount,
      category_id,
      categories (
        id,
        name
      )
    `)
    .eq('user_id', userId)
    .eq('month', month);

  if (!budgets || budgets.length === 0) {
    return [];
  }

  // Get spending per category this month
  const monthStart = month;
  const monthEnd = new Date(new Date(month).setMonth(new Date(month).getMonth() + 1))
    .toISOString().split('T')[0];

  const { data: transactions } = await admin
    .from('transactions')
    .select('category_id, amount')
    .eq('user_id', userId)
    .gte('date', monthStart)
    .lt('date', monthEnd)
    .lt('amount', 0); // Only expenses

  // Calculate spending per category
  const spendingByCategory = new Map<string, number>();
  for (const tx of transactions || []) {
    if (tx.category_id) {
      const current = spendingByCategory.get(tx.category_id) || 0;
      spendingByCategory.set(tx.category_id, current + Math.abs(Number(tx.amount)));
    }
  }

  // Build status list
  return budgets.map(budget => {
    const categories = budget.categories as { id: string; name: string } | null;
    const spent = spendingByCategory.get(budget.category_id) || 0;
    const budgetAmount = Number(budget.amount);
    
    return {
      category_name: categories?.name || 'Unknown',
      category_id: budget.category_id,
      budget_amount: budgetAmount,
      spent_amount: spent,
      percent_used: budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0,
    };
  });
}

export async function GET() {
  return POST();
}

