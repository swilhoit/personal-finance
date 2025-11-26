/**
 * Notification Schedules API
 * CRUD operations for user notification schedule preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: schedules, error } = await supabase
      .from('notification_schedules')
      .select(`
        id,
        schedule_type,
        is_enabled,
        cron_expression,
        timezone,
        discord_guild_id,
        discord_channel_id,
        settings,
        last_run_at,
        next_run_at,
        created_at
      `)
      .eq('user_id', user.id)
      .order('schedule_type');

    if (error) {
      console.error('Error fetching schedules:', error);
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }

    return NextResponse.json({ schedules: schedules || [] });

  } catch (error) {
    console.error('Error in GET /notification-schedules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      schedule_type, 
      is_enabled = true, 
      cron_expression,
      timezone = 'America/New_York',
      discord_guild_id,
      discord_channel_id,
      settings = {}
    } = body;

    // Validate schedule_type
    const validTypes = ['weekly_report', 'daily_summary', 'budget_alert', 'market_alert', 'recurring_reminder'];
    if (!validTypes.includes(schedule_type)) {
      return NextResponse.json({ error: 'Invalid schedule type' }, { status: 400 });
    }

    // Upsert the schedule (one per type per user)
    const { data: schedule, error } = await supabase
      .from('notification_schedules')
      .upsert({
        user_id: user.id,
        schedule_type,
        is_enabled,
        cron_expression: cron_expression || getDefaultCron(schedule_type),
        timezone,
        discord_guild_id,
        discord_channel_id,
        settings,
      }, {
        onConflict: 'user_id,schedule_type',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating schedule:', error);
      return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
    }

    return NextResponse.json({ schedule, message: 'Schedule saved successfully' });

  } catch (error) {
    console.error('Error in POST /notification-schedules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Schedule ID required' }, { status: 400 });
    }

    // Only allow updating specific fields
    const allowedFields = ['is_enabled', 'cron_expression', 'timezone', 'discord_guild_id', 'discord_channel_id', 'settings'];
    const filteredUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) {
        filteredUpdates[key] = updates[key];
      }
    }

    const { data: schedule, error } = await supabase
      .from('notification_schedules')
      .update(filteredUpdates)
      .eq('id', id)
      .eq('user_id', user.id) // Security: ensure user owns this schedule
      .select()
      .single();

    if (error) {
      console.error('Error updating schedule:', error);
      return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 });
    }

    return NextResponse.json({ schedule, message: 'Schedule updated successfully' });

  } catch (error) {
    console.error('Error in PATCH /notification-schedules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Schedule ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('notification_schedules')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting schedule:', error);
      return NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Schedule deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /notification-schedules:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getDefaultCron(scheduleType: string): string {
  switch (scheduleType) {
    case 'weekly_report':
      return '0 10 * * 0'; // Sunday 10am
    case 'daily_summary':
      return '0 9 * * *';  // Daily 9am
    case 'budget_alert':
      return '0 9 * * *';  // Daily 9am
    case 'market_alert':
      return '0 * * * 1-5'; // Hourly on weekdays
    case 'recurring_reminder':
      return '0 9 1 * *';  // 1st of each month
    default:
      return '0 10 * * 0';
  }
}




