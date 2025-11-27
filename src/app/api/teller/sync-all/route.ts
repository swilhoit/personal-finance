/**
 * Teller Sync All Users - Cron Job Endpoint
 * Syncs transactions for ALL users with active Teller enrollments
 * 
 * Triggered by Vercel Cron: 0 3 * * * (daily at 3am UTC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { syncTellerToSupabase } from '@/services/tellerService';
import { verifyCronRequest } from '@/lib/api/cron-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for Pro plan

export async function POST(request: NextRequest) {
  // Verify cron authorization
  const authError = verifyCronRequest(request);
  if (authError) return authError;
  const startTime = Date.now();
  const admin = createSupabaseAdminClient();
  
  const results: Array<{
    user_id: string;
    enrollment_id: string;
    institution: string | null;
    success: boolean;
    accounts_synced?: number;
    transactions_synced?: number;
    error?: string;
  }> = [];

  try {
    // Get all active Teller enrollments across all users
    const { data: enrollments, error: fetchError } = await admin
      .from('teller_enrollments')
      .select('user_id, enrollment_id, access_token, institution_name')
      .eq('status', 'active');

    if (fetchError) {
      console.error('[Teller Sync All] Failed to fetch enrollments:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch enrollments', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active enrollments to sync',
        stats: { total: 0, synced: 0, failed: 0 },
      });
    }

    console.log(`[Teller Sync All] Processing ${enrollments.length} enrollments...`);

    // Process each enrollment
    for (const enrollment of enrollments) {
      try {
        const result = await syncTellerToSupabase(
          admin,
          enrollment.user_id,
          enrollment.enrollment_id,
          enrollment.access_token
        );

        results.push({
          user_id: enrollment.user_id,
          enrollment_id: enrollment.enrollment_id,
          institution: enrollment.institution_name,
          success: true,
          accounts_synced: result.accountsSynced,
          transactions_synced: result.transactionsSynced,
        });

        // Log successful sync run
        await admin.from('sync_runs').insert({
          user_id: enrollment.user_id,
          item_id: enrollment.enrollment_id,
          status: 'success',
          note: `Synced ${result.accountsSynced} accounts, ${result.transactionsSynced} transactions`,
          finished_at: new Date().toISOString(),
        });

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[Teller Sync All] Error for ${enrollment.enrollment_id}:`, errorMessage);

        results.push({
          user_id: enrollment.user_id,
          enrollment_id: enrollment.enrollment_id,
          institution: enrollment.institution_name,
          success: false,
          error: errorMessage,
        });

        // Log failed sync run
        await admin.from('sync_runs').insert({
          user_id: enrollment.user_id,
          item_id: enrollment.enrollment_id,
          status: 'error',
          note: errorMessage,
          finished_at: new Date().toISOString(),
        });

        // Mark enrollment as needing attention if auth error
        if (errorMessage.includes('unauthorized') || errorMessage.includes('token')) {
          await admin
            .from('teller_enrollments')
            .update({ status: 'needs_attention' })
            .eq('enrollment_id', enrollment.enrollment_id);
        }
      }
    }

    const duration = Date.now() - startTime;
    const stats = {
      total: results.length,
      synced: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      duration_ms: duration,
    };

    console.log(`[Teller Sync All] Complete:`, stats);

    return NextResponse.json({
      success: true,
      stats,
      results,
    });

  } catch (error) {
    console.error('[Teller Sync All] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also support GET for Vercel cron (uses same auth)
export async function GET(request: NextRequest) {
  return POST(request);
}





