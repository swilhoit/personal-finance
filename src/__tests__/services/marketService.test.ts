import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketService, type TickerData } from '@/services/marketService';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      })),
    })),
  })),
};

describe('MarketService', () => {
  let service: MarketService;

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new MarketService(mockSupabase as any);
  });

  describe('getTopMovers', () => {
    it('returns top gainers sorted by change percent', () => {
      const data = new Map<string, TickerData>([
        ['AAPL', createTickerData('AAPL', 150, 5.2)],
        ['GOOGL', createTickerData('GOOGL', 140, 3.1)],
        ['MSFT', createTickerData('MSFT', 380, 7.5)],
        ['AMZN', createTickerData('AMZN', 180, 2.0)],
        ['TSLA', createTickerData('TSLA', 250, 8.2)],
      ]);

      const { gainers, losers } = service.getTopMovers(data, 3);

      expect(gainers).toHaveLength(3);
      expect(gainers[0].symbol).toBe('TSLA'); // 8.2%
      expect(gainers[1].symbol).toBe('MSFT'); // 7.5%
      expect(gainers[2].symbol).toBe('AAPL'); // 5.2%
      expect(losers).toHaveLength(0);
    });

    it('returns top losers sorted by change percent', () => {
      const data = new Map<string, TickerData>([
        ['AAPL', createTickerData('AAPL', 150, -2.5)],
        ['GOOGL', createTickerData('GOOGL', 140, -5.1)],
        ['MSFT', createTickerData('MSFT', 380, -1.2)],
        ['AMZN', createTickerData('AMZN', 180, -3.8)],
      ]);

      const { gainers, losers } = service.getTopMovers(data, 3);

      expect(losers).toHaveLength(3);
      expect(losers[0].symbol).toBe('GOOGL'); // -5.1%
      expect(losers[1].symbol).toBe('AMZN'); // -3.8%
      expect(losers[2].symbol).toBe('AAPL'); // -2.5%
      expect(gainers).toHaveLength(0);
    });

    it('handles mixed gainers and losers', () => {
      const data = new Map<string, TickerData>([
        ['AAPL', createTickerData('AAPL', 150, 5.2)],
        ['GOOGL', createTickerData('GOOGL', 140, -3.1)],
        ['MSFT', createTickerData('MSFT', 380, 2.5)],
        ['AMZN', createTickerData('AMZN', 180, -1.2)],
        ['TSLA', createTickerData('TSLA', 250, 0)], // No change - neither gainer nor loser
      ]);

      const { gainers, losers } = service.getTopMovers(data, 2);

      expect(gainers).toHaveLength(2);
      expect(gainers[0].symbol).toBe('AAPL'); // 5.2%
      expect(gainers[1].symbol).toBe('MSFT'); // 2.5%

      expect(losers).toHaveLength(2);
      expect(losers[0].symbol).toBe('GOOGL'); // -3.1%
      expect(losers[1].symbol).toBe('AMZN'); // -1.2%
    });

    it('returns empty arrays for empty data', () => {
      const data = new Map<string, TickerData>();

      const { gainers, losers } = service.getTopMovers(data);

      expect(gainers).toHaveLength(0);
      expect(losers).toHaveLength(0);
    });

    it('respects the count parameter', () => {
      const data = new Map<string, TickerData>([
        ['AAPL', createTickerData('AAPL', 150, 5.2)],
        ['GOOGL', createTickerData('GOOGL', 140, 3.1)],
        ['MSFT', createTickerData('MSFT', 380, 7.5)],
        ['AMZN', createTickerData('AMZN', 180, 2.0)],
        ['TSLA', createTickerData('TSLA', 250, 8.2)],
        ['META', createTickerData('META', 500, 4.5)],
      ]);

      const result1 = service.getTopMovers(data, 2);
      expect(result1.gainers).toHaveLength(2);

      const result2 = service.getTopMovers(data, 10);
      expect(result2.gainers).toHaveLength(6); // Only 6 available
    });

    it('uses default count of 5', () => {
      const data = new Map<string, TickerData>([
        ['A', createTickerData('A', 100, 1)],
        ['B', createTickerData('B', 100, 2)],
        ['C', createTickerData('C', 100, 3)],
        ['D', createTickerData('D', 100, 4)],
        ['E', createTickerData('E', 100, 5)],
        ['F', createTickerData('F', 100, 6)],
        ['G', createTickerData('G', 100, 7)],
      ]);

      const { gainers } = service.getTopMovers(data);
      expect(gainers).toHaveLength(5);
    });
  });

  describe('clearCache', () => {
    it('clears the cache', async () => {
      // Access the private cache for testing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const privateService = service as any;

      // Add something to cache
      privateService.cache.set('TEST', {
        data: createTickerData('TEST', 100, 1),
        expires: Date.now() + 60000
      });

      expect(privateService.cache.size).toBe(1);

      service.clearCache();

      expect(privateService.cache.size).toBe(0);
    });
  });

  describe('cache behavior', () => {
    it('returns cached data if not expired', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const privateService = service as any;
      const cachedData = createTickerData('CACHED', 999, 10);

      privateService.cache.set('CACHED', {
        data: cachedData,
        expires: Date.now() + 60000, // 1 minute in the future
      });

      const result = await service.fetchTickerData('CACHED', false);

      expect(result).toEqual(cachedData);
    });
  });
});

// Helper function to create TickerData for testing
function createTickerData(
  symbol: string,
  price: number,
  changePercent: number
): TickerData {
  return {
    symbol,
    name: `${symbol} Inc`,
    price,
    change: price * (changePercent / 100),
    changePercent,
    timestamp: new Date(),
  };
}
