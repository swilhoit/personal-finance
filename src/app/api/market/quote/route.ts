/**
 * Market Quote API
 * Fetch real-time stock quotes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { MarketService } from '@/services/marketService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const symbols = searchParams.get('symbols')?.split(',').map(s => s.trim().toUpperCase());

    if (!symbols || symbols.length === 0) {
      return NextResponse.json(
        { error: 'Symbols parameter required' },
        { status: 400 }
      );
    }

    if (symbols.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 symbols per request' },
        { status: 400 }
      );
    }

    const marketService = new MarketService(supabase);
    const quotes = await marketService.fetchMultipleTickers(symbols);

    const response = Array.from(quotes.entries()).map(([symbol, data]) => ({
      symbol,
      name: data.name,
      price: data.price,
      change: data.change,
      changePercent: data.changePercent,
      volume: data.volume,
      marketCap: data.marketCap,
      performance: {
        '30d': data.performance30d,
        '90d': data.performance90d,
        '365d': data.performance365d,
      },
      timestamp: data.timestamp,
    }));

    return NextResponse.json({ quotes: response });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}





