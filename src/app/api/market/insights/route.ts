/**
 * Market Insights API
 * Real-time market analysis using Perplexity API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PerplexityService } from '@/services/perplexityService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'overview';
    const symbol = searchParams.get('symbol');
    const sector = searchParams.get('sector');
    const query = searchParams.get('query');

    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityApiKey) {
      return NextResponse.json(
        { error: 'Perplexity API not configured' },
        { status: 500 }
      );
    }

    const perplexity = new PerplexityService(perplexityApiKey);

    switch (type) {
      case 'overview': {
        const insight = await perplexity.getMarketOverview();
        return NextResponse.json({ insight });
      }

      case 'stock': {
        if (!symbol) {
          return NextResponse.json(
            { error: 'Symbol required for stock analysis' },
            { status: 400 }
          );
        }
        const analysis = await perplexity.analyzeStock(symbol);
        return NextResponse.json({ analysis });
      }

      case 'sector': {
        if (!sector) {
          return NextResponse.json(
            { error: 'Sector required for sector analysis' },
            { status: 400 }
          );
        }
        const insight = await perplexity.getSectorAnalysis(sector);
        return NextResponse.json({ insight });
      }

      case 'portfolio': {
        // Get user's watchlist symbols
        const { data: watchlist } = await supabase
          .from('user_watchlists')
          .select('symbol')
          .eq('user_id', user.id);

        const symbols = watchlist?.map(w => w.symbol) || [];
        const insight = await perplexity.getPortfolioInsights(symbols);
        return NextResponse.json({ insight });
      }

      case 'search': {
        if (!query) {
          return NextResponse.json(
            { error: 'Query required for search' },
            { status: 400 }
          );
        }
        const insight = await perplexity.searchMarketInfo(query);
        return NextResponse.json({ insight });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid insight type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error fetching market insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market insights' },
      { status: 500 }
    );
  }
}








