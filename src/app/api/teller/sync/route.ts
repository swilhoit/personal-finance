/**
 * Teller Sync API
 * Triggers a sync of accounts and transactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncTellerToSupabase } from '@/services/tellerService';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active enrollments for this user
    const { data: enrollments, error: fetchError } = await supabase
      .from('teller_enrollments')
      .select('enrollment_id, access_token, institution_name')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch enrollments' },
        { status: 500 }
      );
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json(
        { error: 'No connected banks found' },
        { status: 404 }
      );
    }

    // Sync each enrollment
    const results = [];
    for (const enrollment of enrollments) {
      try {
        const result = await syncTellerToSupabase(
          supabase,
          user.id,
          enrollment.enrollment_id,
          enrollment.access_token
        );
        results.push({
          institution: enrollment.institution_name,
          ...result,
          success: true,
        });
      } catch (error: any) {
        results.push({
          institution: enrollment.institution_name,
          success: false,
          error: error.message,
        });
      }
    }

    // Log sync run
    await supabase.from('sync_runs').insert({
      user_id: user.id,
      status: results.every(r => r.success) ? 'success' : 'partial',
      note: `Synced ${results.filter(r => r.success).length}/${results.length} banks`,
    });

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error syncing Teller:', error);
    return NextResponse.json(
      { error: 'Failed to sync' },
      { status: 500 }
    );
  }
}


