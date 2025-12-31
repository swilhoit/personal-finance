/**
 * Market Watchlist API
 * Manage user's stock watchlist
 */

import { NextRequest } from 'next/server';
import { MarketService } from '@/services/marketService';
import { requireAuth, isAuthError, successResponse, errorResponse, ApiErrors } from '@/lib/api';

export async function GET() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth.error;
    const { user, supabase } = auth;

    const marketService = new MarketService(supabase);
    const watchlist = await marketService.getWatchlistWithPrices(user.id);

    return successResponse(watchlist, { count: watchlist.length });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return errorResponse('Failed to fetch watchlist');
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth.error;
    const { user, supabase } = auth;

    const body = await request.json();
    const { symbol, notes, targetPrice, alertAbove, alertBelow } = body;

    if (!symbol) {
      return ApiErrors.validationError('symbol');
    }

    // Validate symbol format (alphanumeric, 1-10 chars)
    const cleanSymbol = symbol.toUpperCase().trim();
    if (!/^[A-Z]{1,10}$/.test(cleanSymbol)) {
      return ApiErrors.badRequest('Invalid symbol format');
    }

    const { error } = await supabase.from('user_watchlists').upsert({
      user_id: user.id,
      symbol: cleanSymbol,
      notes,
      target_price: targetPrice,
      alert_above: alertAbove,
      alert_below: alertBelow,
      alerts_enabled: !!(alertAbove || alertBelow),
    }, { onConflict: 'user_id,symbol' });

    if (error) {
      return errorResponse('Failed to add to watchlist');
    }

    return successResponse(
      { symbol: cleanSymbol },
      undefined,
      201
    );
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return errorResponse('Failed to add to watchlist');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth.error;
    const { user, supabase } = auth;

    const body = await request.json();
    const { symbol } = body;

    if (!symbol) {
      return ApiErrors.validationError('symbol');
    }

    const { error } = await supabase
      .from('user_watchlists')
      .delete()
      .eq('user_id', user.id)
      .eq('symbol', symbol.toUpperCase());

    if (error) {
      return errorResponse('Failed to remove from watchlist');
    }

    return successResponse({ removed: symbol.toUpperCase() });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return errorResponse('Failed to remove from watchlist');
  }
}


















