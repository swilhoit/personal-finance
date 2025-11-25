/**
 * AI Analysis Service
 * Generates weekly portfolio and spending analysis using Claude
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

export interface WeeklyAnalysis {
  weekStart: Date;
  weekEnd: Date;
  executiveSummary: string;
  spendingInsights: {
    totalSpent: number;
    totalIncome: number;
    topCategories: { name: string; amount: number; change?: number }[];
    unusualTransactions: { merchant: string; amount: number; reason: string }[];
  };
  portfolioInsights?: {
    totalValue?: number;
    weeklyReturn: number;
    topPerformers: { symbol: string; performance: number; catalyst?: string }[];
    worstPerformers: { symbol: string; performance: number; reason?: string }[];
  };
  recommendations: string[];
  alerts: string[];
}

export class AnalysisService {
  private anthropic: Anthropic;
  private supabase: ReturnType<typeof createClient>;

  constructor(apiKey: string, supabase: ReturnType<typeof createClient>) {
    this.anthropic = new Anthropic({ apiKey });
    this.supabase = supabase;
  }

  /**
   * Generate weekly financial analysis
   */
  async generateWeeklyAnalysis(userId: string): Promise<WeeklyAnalysis> {
    const weekEnd = new Date();
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    // Gather data
    const [transactions, marketData, budgets, holdings] = await Promise.all([
      this.getWeeklyTransactions(userId, weekStartStr, weekEndStr),
      this.getWeeklyMarketData(userId, weekStartStr, weekEndStr),
      this.getUserBudgets(userId),
      this.getUserHoldings(userId),
    ]);

    // Build analysis prompt
    const prompt = this.buildAnalysisPrompt(
      transactions,
      marketData,
      budgets,
      holdings,
      weekStartStr,
      weekEndStr
    );

    // Call Claude
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    const analysisText = response.content[0].type === 'text' ? response.content[0].text : '';
    const analysis = this.parseAnalysis(analysisText, weekStart, weekEnd, transactions, marketData);

    // Save to database
    await this.saveAnalysis(userId, analysis);

    return analysis;
  }

  private buildAnalysisPrompt(
    transactions: any[],
    marketData: any[],
    budgets: any[],
    holdings: any[],
    weekStart: string,
    weekEnd: string
  ): string {
    // Calculate spending by category
    const spendingByCategory = new Map<string, number>();
    let totalSpent = 0;
    let totalIncome = 0;

    for (const tx of transactions) {
      if (tx.amount < 0) {
        totalSpent += Math.abs(tx.amount);
        const cat = tx.category || 'Uncategorized';
        spendingByCategory.set(cat, (spendingByCategory.get(cat) || 0) + Math.abs(tx.amount));
      } else {
        totalIncome += tx.amount;
      }
    }

    const categorySpending = Array.from(spendingByCategory.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Format budget data
    const budgetText = budgets.map(b => 
      `- ${b.category_name || 'Unknown'}: $${b.amount} budget`
    ).join('\n') || 'No budgets set';

    // Format holdings
    const holdingsText = holdings.map(h =>
      `- ${h.symbol}: ${h.shares} shares @ $${h.cost_basis || 'N/A'} avg`
    ).join('\n') || 'No holdings tracked';

    // Format market data
    const marketText = marketData.slice(0, 10).map(m =>
      `- ${m.symbol}: $${m.price?.toFixed(2)} (${m.change_percent >= 0 ? '+' : ''}${m.change_percent?.toFixed(2)}%)`
    ).join('\n') || 'No market data';

    return `You are a personal financial advisor analyzing a user's weekly finances.

## TRANSACTION DATA (${weekStart} to ${weekEnd})

Total Spent: $${totalSpent.toFixed(2)}
Total Income: $${totalIncome.toFixed(2)}
Net: $${(totalIncome - totalSpent).toFixed(2)}

### Spending by Category
${categorySpending.map(c => `- ${c.name}: $${c.amount.toFixed(2)}`).join('\n')}

### Recent Transactions (${transactions.length} total)
${transactions.slice(0, 20).map(t => 
  `- ${t.date}: ${t.merchant_name || t.name} | $${Math.abs(t.amount).toFixed(2)} | ${t.category || 'Uncategorized'}`
).join('\n')}

## BUDGET DATA
${budgetText}

## INVESTMENT HOLDINGS
${holdingsText}

## MARKET DATA (Watchlist Performance)
${marketText}

## REQUIRED OUTPUT

Provide your analysis in this JSON format:

{
  "executiveSummary": "2-3 sentence summary of the week's financial health",
  "spendingInsights": {
    "highlights": ["Key insight 1", "Key insight 2"],
    "concerns": ["Potential concern 1"],
    "unusualTransactions": [
      {"merchant": "...", "amount": 0.00, "reason": "Why this is unusual"}
    ]
  },
  "portfolioInsights": {
    "weeklyReturn": 0.0,
    "analysis": "Brief portfolio analysis",
    "topPerformers": [{"symbol": "...", "performance": 0.0, "catalyst": "..."}],
    "worstPerformers": [{"symbol": "...", "performance": 0.0, "reason": "..."}]
  },
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2"
  ],
  "alerts": [
    "Important alert if any budget exceeded or unusual activity"
  ]
}

Focus on:
1. Spending patterns and budget adherence
2. Any unusual or concerning transactions
3. Actionable recommendations for next week
4. Portfolio performance if holdings exist

Return ONLY valid JSON.`;
  }

  private parseAnalysis(
    responseText: string,
    weekStart: Date,
    weekEnd: Date,
    transactions: any[],
    marketData: any[]
  ): WeeklyAnalysis {
    try {
      // Extract JSON from response
      let jsonStr = responseText.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(jsonStr);

      // Calculate totals from transactions
      let totalSpent = 0;
      let totalIncome = 0;
      const categoryTotals = new Map<string, number>();

      for (const tx of transactions) {
        if (tx.amount < 0) {
          totalSpent += Math.abs(tx.amount);
          const cat = tx.category || 'Uncategorized';
          categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + Math.abs(tx.amount));
        } else {
          totalIncome += tx.amount;
        }
      }

      const topCategories = Array.from(categoryTotals.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      return {
        weekStart,
        weekEnd,
        executiveSummary: parsed.executiveSummary || 'Analysis complete.',
        spendingInsights: {
          totalSpent,
          totalIncome,
          topCategories,
          unusualTransactions: parsed.spendingInsights?.unusualTransactions || [],
        },
        portfolioInsights: parsed.portfolioInsights ? {
          weeklyReturn: parsed.portfolioInsights.weeklyReturn || 0,
          topPerformers: parsed.portfolioInsights.topPerformers || [],
          worstPerformers: parsed.portfolioInsights.worstPerformers || [],
        } : undefined,
        recommendations: parsed.recommendations || [],
        alerts: parsed.alerts || [],
      };
    } catch (error) {
      console.error('Error parsing analysis:', error);
      
      // Return basic analysis if parsing fails
      let totalSpent = 0;
      let totalIncome = 0;
      
      for (const tx of transactions) {
        if (tx.amount < 0) totalSpent += Math.abs(tx.amount);
        else totalIncome += tx.amount;
      }

      return {
        weekStart,
        weekEnd,
        executiveSummary: `This week you spent $${totalSpent.toFixed(2)} and earned $${totalIncome.toFixed(2)}.`,
        spendingInsights: {
          totalSpent,
          totalIncome,
          topCategories: [],
          unusualTransactions: [],
        },
        recommendations: ['Review your spending categories', 'Set up budgets for better tracking'],
        alerts: [],
      };
    }
  }

  private async getWeeklyTransactions(userId: string, startDate: string, endDate: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }

    return data || [];
  }

  private async getWeeklyMarketData(userId: string, startDate: string, endDate: string): Promise<any[]> {
    // Get user's watchlist symbols
    const { data: watchlist } = await this.supabase
      .from('user_watchlists')
      .select('symbol')
      .eq('user_id', userId);

    if (!watchlist || watchlist.length === 0) return [];

    const symbols = watchlist.map(w => w.symbol);

    const { data, error } = await this.supabase
      .from('market_data')
      .select('*')
      .in('symbol', symbols)
      .eq('date', endDate);

    if (error) {
      console.error('Error fetching market data:', error);
      return [];
    }

    return data || [];
  }

  private async getUserBudgets(userId: string): Promise<any[]> {
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';

    const { data, error } = await this.supabase
      .from('budgets')
      .select(`
        *,
        categories (name)
      `)
      .eq('user_id', userId)
      .gte('month', currentMonth);

    if (error) {
      console.error('Error fetching budgets:', error);
      return [];
    }

    return (data || []).map(b => ({
      ...b,
      category_name: b.categories?.name,
    }));
  }

  private async getUserHoldings(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('user_holdings')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching holdings:', error);
      return [];
    }

    return data || [];
  }

  private async saveAnalysis(userId: string, analysis: WeeklyAnalysis): Promise<void> {
    try {
      await this.supabase.from('weekly_analysis').insert({
        user_id: userId,
        week_start: analysis.weekStart.toISOString().split('T')[0],
        week_end: analysis.weekEnd.toISOString().split('T')[0],
        analysis_type: 'portfolio',
        title: `Weekly Analysis ${analysis.weekStart.toLocaleDateString()} - ${analysis.weekEnd.toLocaleDateString()}`,
        executive_summary: analysis.executiveSummary,
        detailed_analysis: {
          spendingInsights: analysis.spendingInsights,
          portfolioInsights: analysis.portfolioInsights,
        },
        recommendations: analysis.recommendations,
        key_metrics: {
          totalSpent: analysis.spendingInsights.totalSpent,
          totalIncome: analysis.spendingInsights.totalIncome,
          weeklyReturn: analysis.portfolioInsights?.weeklyReturn,
        },
      });
    } catch (error) {
      console.error('Error saving analysis:', error);
    }
  }

  /**
   * Get past analyses for a user
   */
  async getPastAnalyses(userId: string, limit: number = 10): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('weekly_analysis')
      .select('*')
      .eq('user_id', userId)
      .order('week_start', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching past analyses:', error);
      return [];
    }

    return data || [];
  }
}


