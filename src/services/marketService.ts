/**
 * Market Data Service
 * Fetches stock prices, historical performance using Yahoo Finance
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// Dynamic import for yahoo-finance2 (ESM)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let yahooFinance: any = null;

async function getYahooFinance() {
  if (!yahooFinance) {
    const yahooModule = await import('yahoo-finance2');
    yahooFinance = yahooModule.default;
  }
  return yahooFinance;
}

export interface TickerData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  performance30d?: number;
  performance90d?: number;
  performance365d?: number;
  timestamp: Date;
}

export interface PortfolioCategory {
  name: string;
  description: string;
  emoji: string;
  tickers: string[];
  targetAllocation: number;
}

export class MarketService {
  private supabase: SupabaseClient;
  private cache: Map<string, { data: TickerData; expires: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Fetch quote data for a single ticker
   */
  async fetchTickerData(symbol: string, includeHistorical: boolean = true): Promise<TickerData | null> {
    // Check cache
    const cached = this.cache.get(symbol);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    try {
      const yf = await getYahooFinance();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const quote: any = await yf.quote(symbol);

      if (!quote || !quote.regularMarketPrice) {
        console.warn(`No data available for ${symbol}`);
        return null;
      }

      const tickerData: TickerData = {
        symbol: quote.symbol || symbol,
        name: quote.shortName || quote.longName || symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume,
        marketCap: quote.marketCap,
        timestamp: new Date(),
      };

      // Fetch historical performance if requested
      if (includeHistorical) {
        const historical = await this.fetchHistoricalPerformance(symbol);
        if (historical) {
          tickerData.performance30d = historical.performance30d;
          tickerData.performance90d = historical.performance90d;
          tickerData.performance365d = historical.performance365d;
        }
      }

      // Cache the result
      this.cache.set(symbol, {
        data: tickerData,
        expires: Date.now() + this.CACHE_TTL,
      });

      // Save to database
      await this.saveMarketData(tickerData);

      return tickerData;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to fetch data for ${symbol}:`, errorMessage);
      return null;
    }
  }

  /**
   * Fetch historical performance for a ticker
   */
  private async fetchHistoricalPerformance(symbol: string): Promise<{
    performance30d?: number;
    performance90d?: number;
    performance365d?: number;
  } | null> {
    try {
      const yf = await getYahooFinance();
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const historical: any = await yf.historical(symbol, {
        period1: oneYearAgo,
        period2: now,
        interval: '1d',
      });

      if (!historical || historical.length === 0) {
        return null;
      }

      const currentPrice = historical[historical.length - 1]?.close;
      if (!currentPrice) return null;

      const findClosestPrice = (daysAgo: number): number | null => {
        const targetDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        let closest = historical[0];
        let minDiff = Math.abs(new Date(historical[0].date).getTime() - targetDate.getTime());

        for (const entry of historical) {
          const diff = Math.abs(new Date(entry.date).getTime() - targetDate.getTime());
          if (diff < minDiff) {
            minDiff = diff;
            closest = entry;
          }
        }
        return closest?.close || null;
      };

      const price30d = findClosestPrice(30);
      const price90d = findClosestPrice(90);
      const price365d = findClosestPrice(365);

      return {
        performance30d: price30d ? ((currentPrice - price30d) / price30d) * 100 : undefined,
        performance90d: price90d ? ((currentPrice - price90d) / price90d) * 100 : undefined,
        performance365d: price365d ? ((currentPrice - price365d) / price365d) * 100 : undefined,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`Failed to fetch historical data for ${symbol}:`, errorMessage);
      return null;
    }
  }

  /**
   * Save market data to Supabase
   */
  private async saveMarketData(data: TickerData): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    try {
      await this.supabase.from('market_data').upsert({
        symbol: data.symbol,
        name: data.name,
        price: data.price,
        change_amount: data.change,
        change_percent: data.changePercent,
        volume: data.volume,
        market_cap: data.marketCap,
        performance_30d: data.performance30d,
        performance_90d: data.performance90d,
        performance_365d: data.performance365d,
        date: today,
      }, { onConflict: 'symbol,date' });
    } catch (error) {
      console.warn(`Failed to save market data for ${data.symbol}:`, error);
    }
  }

  /**
   * Fetch data for multiple tickers
   */
  async fetchMultipleTickers(symbols: string[]): Promise<Map<string, TickerData>> {
    const results = new Map<string, TickerData>();

    // Fetch in batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const promises = batch.map(symbol => this.fetchTickerData(symbol));
      const batchResults = await Promise.allSettled(promises);

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          results.set(batch[index], result.value);
        }
      });

      // Small delay between batches
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return results;
  }

  /**
   * Get portfolio categories from database
   */
  async getPortfolioCategories(): Promise<PortfolioCategory[]> {
    const { data, error } = await this.supabase
      .from('portfolio_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.error('Error fetching portfolio categories:', error);
      return [];
    }

    return (data || []).map(cat => ({
      name: cat.name,
      description: cat.description,
      emoji: cat.emoji,
      tickers: cat.tickers,
      targetAllocation: cat.target_allocation,
    }));
  }

  /**
   * Fetch all tickers from portfolio categories
   */
  async fetchPortfolio(): Promise<Map<string, Map<string, TickerData>>> {
    const categories = await this.getPortfolioCategories();
    const categoryData = new Map<string, Map<string, TickerData>>();

    for (const category of categories) {
      console.log(`Fetching ${category.name}...`);
      const data = await this.fetchMultipleTickers(category.tickers);
      categoryData.set(category.name, data);

      // Delay between categories
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return categoryData;
  }

  /**
   * Get top movers from portfolio
   */
  getTopMovers(data: Map<string, TickerData>, count: number = 5): {
    gainers: TickerData[];
    losers: TickerData[];
  } {
    const allTickers = Array.from(data.values());

    const gainers = allTickers
      .filter(t => t.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, count);

    const losers = allTickers
      .filter(t => t.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, count);

    return { gainers, losers };
  }

  /**
   * Get user's watchlist with current prices
   */
  async getWatchlistWithPrices(userId: string): Promise<(TickerData & { notes?: string; targetPrice?: number })[]> {
    const { data: watchlist, error } = await this.supabase
      .from('user_watchlists')
      .select('symbol, notes, target_price')
      .eq('user_id', userId);

    if (error || !watchlist || watchlist.length === 0) {
      return [];
    }

    const symbols = watchlist.map(w => w.symbol);
    const prices = await this.fetchMultipleTickers(symbols);

    return watchlist
      .map(w => {
        const priceData = prices.get(w.symbol);
        if (!priceData) return null;
        return {
          ...priceData,
          notes: w.notes,
          targetPrice: w.target_price,
        };
      })
      .filter((w): w is NonNullable<typeof w> => w !== null);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}


