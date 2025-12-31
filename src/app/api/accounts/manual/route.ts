/**
 * Manual Accounts API
 * Create and list manually-added accounts (not connected via Teller)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { manualAccountSchema } from '@/lib/validations';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: accounts, error: fetchError } = await supabase
      .from('manual_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching manual accounts:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch accounts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      accounts: accounts || [],
      count: accounts?.length || 0,
    });
  } catch (error) {
    console.error('Error in manual accounts GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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

    // Validate input
    const validation = manualAccountSchema.safeParse(body);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = err.message;
        }
      });
      return NextResponse.json({ error: 'Validation failed', errors }, { status: 400 });
    }

    const { name, type, balance } = validation.data;

    // Generate unique account ID
    const accountId = `manual_${randomUUID()}`;

    // Insert manual account
    const { data: newAccount, error: insertError } = await supabase
      .from('manual_accounts')
      .insert({
        user_id: user.id,
        account_id: accountId,
        name,
        type,
        current_balance: balance || 0,
        currency: 'USD',
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating manual account:', insertError);
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      account: newAccount,
    });
  } catch (error) {
    console.error('Error in manual accounts POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
