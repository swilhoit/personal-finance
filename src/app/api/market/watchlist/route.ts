/**
 * Market Watchlist API
 * Manage user's stock watchlist
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MarketService } from '@/services/marketService';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const marketService = new MarketService(supabase);
    const watchlist = await marketService.getWatchlistWithPrices(user.id);

    return NextResponse.json({
      watchlist,
      count: watchlist.length,
    });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
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
    const { symbol, notes, targetPrice, alertAbove, alertBelow } = body;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol required' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('user_watchlists').upsert({
      user_id: user.id,
      symbol: symbol.toUpperCase(),
      notes,
      target_price: targetPrice,
      alert_above: alertAbove,
      alert_below: alertBelow,
      alerts_enabled: !!(alertAbove || alertBelow),
    }, { onConflict: 'user_id,symbol' });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to add to watchlist' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${symbol.toUpperCase()} added to watchlist`,
    });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to add to watchlist' },
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
    const { symbol } = body;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('user_watchlists')
      .delete()
      .eq('user_id', user.id)
      .eq('symbol', symbol.toUpperCase());

    if (error) {
      return NextResponse.json(
        { error: 'Failed to remove from watchlist' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${symbol.toUpperCase()} removed from watchlist`,
    });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
}


