/**
 * Teller Accounts API
 * List user's connected bank accounts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all accounts for this user
    const { data: accounts, error: fetchError } = await supabase
      .from('teller_accounts')
      .select(`
        *,
        teller_enrollments (
          institution_name,
          status
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch accounts' },
        { status: 500 }
      );
    }

    // Format response
    const formattedAccounts = (accounts || []).map(account => ({
      id: account.id,
      accountId: account.account_id,
      name: account.name,
      type: account.type,
      subtype: account.subtype,
      institutionName: account.teller_enrollments?.institution_name,
      lastFour: account.last_four,
      currentBalance: account.current_balance,
      availableBalance: account.available_balance,
      creditLimit: account.credit_limit,
      currency: account.currency,
      lastSynced: account.last_synced_at,
    }));

    return NextResponse.json({
      accounts: formattedAccounts,
      count: formattedAccounts.length,
    });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { enrollmentId } = body;

    if (!enrollmentId) {
      return NextResponse.json(
        { error: 'Enrollment ID required' },
        { status: 400 }
      );
    }

    // Soft delete by marking as disconnected
    const { error } = await supabase
      .from('teller_enrollments')
      .update({ status: 'disconnected' })
      .eq('enrollment_id', enrollmentId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to disconnect account' },
        { status: 500 }
      );
    }

    // Also deactivate associated accounts
    await supabase
      .from('teller_accounts')
      .update({ is_active: false })
      .eq('enrollment_id', enrollmentId)
      .eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting account:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect account' },
      { status: 500 }
    );
  }
}





