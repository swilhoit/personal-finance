/**
 * Manual Account by ID API
 * Get, update, or delete a single manual account
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateAccountSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  balance: z.number().optional(),
  type: z.enum(['checking', 'savings', 'credit']).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: account, error: fetchError } = await supabase
      .from('manual_accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({ account });
  } catch (error) {
    console.error('Error fetching manual account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validation = updateAccountSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.error.errors },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (validation.data.name !== undefined) updates.name = validation.data.name;
    if (validation.data.balance !== undefined) updates.current_balance = validation.data.balance;
    if (validation.data.type !== undefined) updates.type = validation.data.type;
    updates.updated_at = new Date().toISOString();

    const { data: account, error: updateError } = await supabase
      .from('manual_accounts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating manual account:', updateError);
      return NextResponse.json(
        { error: 'Failed to update account' },
        { status: 500 }
      );
    }

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, account });
  } catch (error) {
    console.error('Error updating manual account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete by marking as inactive
    const { error: deleteError } = await supabase
      .from('manual_accounts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting manual account:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete account' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting manual account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
