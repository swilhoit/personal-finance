/**
 * Holdings API
 * Manage user's portfolio holdings
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('user_holdings')
      .select('*')
      .eq('user_id', user.id)
      .order('symbol', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch holdings' }, { status: 500 });
    }

    return NextResponse.json({ holdings: data });
  } catch (error) {
    console.error('Error fetching holdings:', error);
    return NextResponse.json({ error: 'Failed to fetch holdings' }, { status: 500 });
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
    const { symbol, shares, costBasis, purchaseDate, accountName, notes } = body;

    if (!symbol || shares === undefined || shares <= 0) {
      return NextResponse.json(
        { error: 'Symbol and shares (> 0) are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.from('user_holdings').insert({
      user_id: user.id,
      symbol: symbol.toUpperCase(),
      shares,
      cost_basis: costBasis || null,
      purchase_date: purchaseDate || null,
      account_name: accountName || null,
      notes: notes || null,
    }).select().single();

    if (error) {
      console.error('Error adding holding:', error);
      return NextResponse.json({ error: 'Failed to add holding' }, { status: 500 });
    }

    // Also add to watchlist if not already there
    await supabase.from('user_watchlists').upsert({
      user_id: user.id,
      symbol: symbol.toUpperCase(),
    }, { onConflict: 'user_id,symbol' });

    return NextResponse.json({
      success: true,
      holding: data,
      message: `${symbol.toUpperCase()} added to holdings`,
    });
  } catch (error) {
    console.error('Error adding holding:', error);
    return NextResponse.json({ error: 'Failed to add holding' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, shares, costBasis, purchaseDate, accountName, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Holding ID required' }, { status: 400 });
    }

    const updateData: Record<string, string | number | undefined> = { updated_at: new Date().toISOString() };
    if (shares !== undefined) updateData.shares = shares;
    if (costBasis !== undefined) updateData.cost_basis = costBasis;
    if (purchaseDate !== undefined) updateData.purchase_date = purchaseDate;
    if (accountName !== undefined) updateData.account_name = accountName;
    if (notes !== undefined) updateData.notes = notes;

    const { error } = await supabase
      .from('user_holdings')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update holding' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating holding:', error);
    return NextResponse.json({ error: 'Failed to update holding' }, { status: 500 });
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
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Holding ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_holdings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete holding' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting holding:', error);
    return NextResponse.json({ error: 'Failed to delete holding' }, { status: 500 });
  }
}

