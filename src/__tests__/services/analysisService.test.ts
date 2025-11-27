import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalysisService } from '@/services/analysisService';

// Mock create function that we'll configure per test
const mockCreate = vi.fn();

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: mockCreate,
      };
      constructor() {
        // Mock constructor
      }
    },
  };
});

// Helper to create mock Supabase
const createMockSupabase = (data: {
  transactions?: unknown[];
  watchlist?: unknown[];
  marketData?: unknown[];
  budgets?: unknown[];
  holdings?: unknown[];
  analyses?: unknown[];
}) => ({
  from: vi.fn((table: string) => {
    switch (table) {
      case 'transactions':
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() => ({
                  order: vi.fn().mockResolvedValue({ data: data.transactions || [], error: null }),
                })),
              })),
            })),
          })),
        };
      case 'user_watchlists':
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: data.watchlist || [], error: null }),
          })),
        };
      case 'market_data':
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ data: data.marketData || [], error: null }),
            })),
          })),
        };
      case 'budgets':
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn().mockResolvedValue({ data: data.budgets || [], error: null }),
            })),
          })),
        };
      case 'user_holdings':
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: data.holdings || [], error: null }),
          })),
        };
      case 'weekly_analysis':
        return {
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({ data: data.analyses || [], error: null }),
              })),
            })),
          })),
        };
      default:
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
    }
  }),
});

describe('AnalysisService', () => {
  let service: AnalysisService;

  beforeEach(() => {
    vi.clearAllMocks();

    const mockSupabase = createMockSupabase({
      transactions: [
        { transaction_id: '1', user_id: 'user1', amount: -50, date: '2024-01-15', category: 'Food', merchant_name: 'Restaurant' },
        { transaction_id: '2', user_id: 'user1', amount: -100, date: '2024-01-16', category: 'Shopping', merchant_name: 'Amazon' },
        { transaction_id: '3', user_id: 'user1', amount: 3000, date: '2024-01-17', category: 'Income', merchant_name: 'Employer' },
      ],
      watchlist: [{ symbol: 'AAPL' }, { symbol: 'GOOGL' }],
      marketData: [
        { symbol: 'AAPL', price: 150, change_percent: 2.5, date: '2024-01-17' },
        { symbol: 'GOOGL', price: 140, change_percent: -1.2, date: '2024-01-17' },
      ],
      budgets: [
        { user_id: 'user1', amount: 500, month: '2024-01-01', categories: { name: 'Food' } },
      ],
      holdings: [
        { user_id: 'user1', symbol: 'AAPL', shares: 10, cost_basis: 145 },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new AnalysisService('test-api-key', mockSupabase as any);
  });

  describe('generateWeeklyAnalysis', () => {
    it('generates analysis with valid JSON response from Claude', async () => {
      const mockResponse = {
        executiveSummary: 'Good week with controlled spending.',
        spendingInsights: {
          highlights: ['Food spending under control'],
          concerns: [],
          unusualTransactions: [],
        },
        portfolioInsights: {
          weeklyReturn: 2.5,
          analysis: 'Portfolio up slightly',
          topPerformers: [{ symbol: 'AAPL', performance: 2.5, catalyst: 'Earnings beat' }],
          worstPerformers: [{ symbol: 'GOOGL', performance: -1.2, reason: 'Market correction' }],
        },
        recommendations: ['Continue tracking food expenses'],
        alerts: [],
      };

      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(mockResponse) }],
      });

      const result = await service.generateWeeklyAnalysis('user1');

      expect(result.executiveSummary).toBe('Good week with controlled spending.');
      expect(result.recommendations).toContain('Continue tracking food expenses');
      expect(result.spendingInsights.totalSpent).toBe(150); // 50 + 100
      expect(result.spendingInsights.totalIncome).toBe(3000);
    });

    it('handles JSON wrapped in markdown code blocks', async () => {
      const mockResponse = {
        executiveSummary: 'Test summary',
        recommendations: ['Test recommendation'],
        alerts: [],
      };

      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: '```json\n' + JSON.stringify(mockResponse) + '\n```' }],
      });

      const result = await service.generateWeeklyAnalysis('user1');

      expect(result.executiveSummary).toBe('Test summary');
    });

    it('returns fallback analysis when Claude returns invalid JSON', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'This is not valid JSON at all!' }],
      });

      const result = await service.generateWeeklyAnalysis('user1');

      // Should return basic fallback analysis
      expect(result.executiveSummary).toContain('$150.00'); // totalSpent
      expect(result.executiveSummary).toContain('$3000.00'); // totalIncome
      expect(result.recommendations).toHaveLength(2);
      expect(result.spendingInsights.topCategories).toHaveLength(0);
    });

    it('calculates spending totals correctly', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify({
          executiveSummary: 'Test',
          recommendations: [],
          alerts: [],
        }) }],
      });

      const result = await service.generateWeeklyAnalysis('user1');

      expect(result.spendingInsights.totalSpent).toBe(150); // 50 + 100
      expect(result.spendingInsights.totalIncome).toBe(3000);
    });

    it('includes correct date range', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify({
          executiveSummary: 'Test',
          recommendations: [],
          alerts: [],
        }) }],
      });

      const result = await service.generateWeeklyAnalysis('user1');

      const daysDiff = (result.weekEnd.getTime() - result.weekStart.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeCloseTo(7, 0);
    });
  });

  describe('getPastAnalyses', () => {
    it('returns past analyses from database', async () => {
      const mockAnalyses = [
        {
          id: '1',
          user_id: 'user1',
          week_start: '2024-01-08',
          week_end: '2024-01-14',
          analysis_type: 'portfolio',
          title: 'Weekly Analysis',
          executive_summary: 'Good week',
          detailed_analysis: {},
          recommendations: [],
          key_metrics: {},
          created_at: '2024-01-15',
        },
      ];

      const mockSupabase = createMockSupabase({ analyses: mockAnalyses });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const analysisService = new AnalysisService('test-api-key', mockSupabase as any);

      const result = await analysisService.getPastAnalyses('user1');

      expect(result).toHaveLength(1);
      expect(result[0].executive_summary).toBe('Good week');
    });

    it('respects the limit parameter', async () => {
      const mockSupabase = createMockSupabase({ analyses: [] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const analysisService = new AnalysisService('test-api-key', mockSupabase as any);

      await analysisService.getPastAnalyses('user1', 5);

      // Verify the mock was called
      expect(mockSupabase.from).toHaveBeenCalledWith('weekly_analysis');
    });

    it('returns empty array on error', async () => {
      const mockSupabase = {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
              })),
            })),
          })),
        })),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const analysisService = new AnalysisService('test-api-key', mockSupabase as any);

      const result = await analysisService.getPastAnalyses('user1');

      expect(result).toEqual([]);
    });
  });
});

describe('Analysis parsing edge cases', () => {
  let service: AnalysisService;

  beforeEach(() => {
    vi.clearAllMocks();
    const mockSupabase = createMockSupabase({ transactions: [] });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new AnalysisService('test-api-key', mockSupabase as any);
  });

  it('handles missing optional fields gracefully', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({
        executiveSummary: 'Minimal response',
        // Missing: recommendations, alerts, spendingInsights, portfolioInsights
      }) }],
    });

    const result = await service.generateWeeklyAnalysis('user1');

    expect(result.executiveSummary).toBe('Minimal response');
    expect(result.recommendations).toEqual([]);
    expect(result.alerts).toEqual([]);
  });

  it('handles partial spending insights', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({
        executiveSummary: 'Test',
        spendingInsights: {
          // Missing unusualTransactions
        },
        recommendations: [],
        alerts: [],
      }) }],
    });

    const result = await service.generateWeeklyAnalysis('user1');

    expect(result.spendingInsights.unusualTransactions).toEqual([]);
  });

  it('handles partial portfolio insights', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({
        executiveSummary: 'Test',
        portfolioInsights: {
          // weeklyReturn missing
          topPerformers: [],
        },
        recommendations: [],
        alerts: [],
      }) }],
    });

    const result = await service.generateWeeklyAnalysis('user1');

    expect(result.portfolioInsights?.weeklyReturn).toBe(0);
    expect(result.portfolioInsights?.topPerformers).toEqual([]);
  });
});
