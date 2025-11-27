/**
 * Perplexity API Service
 * Real-time financial markets news, analysis, and information retrieval
 */

export interface MarketInsight {
  summary: string;
  keyPoints: string[];
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sources: string[];
  timestamp: Date;
}

export interface StockAnalysis {
  symbol: string;
  companyName: string;
  currentPrice?: number;
  analysis: string;
  recentNews: string[];
  outlook: 'positive' | 'negative' | 'neutral';
  keyMetrics?: {
    peRatio?: string;
    marketCap?: string;
    dividendYield?: string;
    fiftyTwoWeekRange?: string;
  };
}

export class PerplexityService {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get real-time market overview and analysis
   */
  async getMarketOverview(): Promise<MarketInsight> {
    const prompt = `Provide a brief, current market analysis covering:
1. How are the major US indices (S&P 500, Nasdaq, Dow) performing today?
2. What are the key market-moving news stories right now?
3. What sectors are leading or lagging?
4. Any significant economic data or Fed news?

Keep it concise and actionable for retail investors. Format as brief bullet points.`;

    const response = await this.query(prompt);
    return this.parseMarketInsight(response);
  }

  /**
   * Analyze a specific stock symbol
   */
  async analyzeStock(symbol: string): Promise<StockAnalysis> {
    const prompt = `Provide a current analysis of ${symbol} stock:
1. What is the current stock price and today's movement?
2. What are the most recent news headlines affecting this stock?
3. What is the current analyst sentiment?
4. Any upcoming catalysts (earnings, product launches, etc.)?
5. Key metrics: P/E ratio, market cap, 52-week range if available.

Be specific with numbers and cite recent sources. Keep it concise.`;

    const response = await this.query(prompt);
    return this.parseStockAnalysis(symbol, response);
  }

  /**
   * Get sector-specific insights
   */
  async getSectorAnalysis(sector: string): Promise<MarketInsight> {
    const prompt = `Provide current analysis of the ${sector} sector:
1. How is the sector performing today/this week?
2. What are the top performing and worst performing stocks in this sector?
3. Any sector-specific news or regulatory changes?
4. What's the outlook for this sector?

Be specific with stock symbols and percentages. Keep it actionable.`;

    const response = await this.query(prompt);
    return this.parseMarketInsight(response);
  }

  /**
   * Get personalized portfolio insights
   */
  async getPortfolioInsights(symbols: string[]): Promise<MarketInsight> {
    if (symbols.length === 0) {
      return {
        summary: 'Add stocks to your watchlist to get personalized insights.',
        keyPoints: ['No stocks in watchlist'],
        sentiment: 'neutral',
        sources: [],
        timestamp: new Date(),
      };
    }

    const symbolList = symbols.slice(0, 10).join(', '); // Limit to 10 symbols
    const prompt = `Provide a brief portfolio analysis for these stocks: ${symbolList}

1. Which of these stocks have significant news today?
2. Are any of these showing unusual price movements?
3. Any earnings coming up for these stocks?
4. Overall portfolio sentiment based on current market conditions?

Be specific and actionable. Focus on what's most relevant right now.`;

    const response = await this.query(prompt);
    return this.parseMarketInsight(response);
  }

  /**
   * Search for market-related information
   */
  async searchMarketInfo(query: string): Promise<MarketInsight> {
    const prompt = `${query}

Provide a focused, factual answer relevant to financial markets and investing. Include specific data, percentages, and stock symbols where applicable. Cite your sources.`;

    const response = await this.query(prompt);
    return this.parseMarketInsight(response);
  }

  /**
   * Core query method to Perplexity API
   */
  private async query(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'You are a financial markets analyst providing real-time market insights. Be concise, specific, and cite your sources. Focus on actionable information for retail investors.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 1024,
          temperature: 0.2,
          return_citations: true,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Perplexity API error:', error);
        throw new Error(`Perplexity API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error querying Perplexity:', error);
      throw error;
    }
  }

  /**
   * Parse response into MarketInsight structure
   */
  private parseMarketInsight(response: string): MarketInsight {
    // Extract bullet points or numbered items
    const lines = response.split('\n').filter(line => line.trim());
    const keyPoints = lines
      .filter(line => /^[\d•\-\*]/.test(line.trim()))
      .map(line => line.replace(/^[\d•\-\*\.\)]+\s*/, '').trim())
      .slice(0, 5);

    // Detect sentiment from keywords
    const lowerResponse = response.toLowerCase();
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    
    const bullishWords = ['rally', 'gains', 'surge', 'bullish', 'upward', 'positive', 'growth', 'record high'];
    const bearishWords = ['decline', 'drop', 'falls', 'bearish', 'downward', 'negative', 'loss', 'concerns'];
    
    const bullishCount = bullishWords.filter(word => lowerResponse.includes(word)).length;
    const bearishCount = bearishWords.filter(word => lowerResponse.includes(word)).length;
    
    if (bullishCount > bearishCount + 1) sentiment = 'bullish';
    else if (bearishCount > bullishCount + 1) sentiment = 'bearish';

    // Extract first paragraph as summary
    const summary = lines[0]?.replace(/^[\d•\-\*\.\)]+\s*/, '').trim() || response.slice(0, 200);

    return {
      summary,
      keyPoints: keyPoints.length > 0 ? keyPoints : [response.slice(0, 300)],
      sentiment,
      sources: [], // Perplexity returns citations separately
      timestamp: new Date(),
    };
  }

  /**
   * Parse response into StockAnalysis structure
   */
  private parseStockAnalysis(symbol: string, response: string): StockAnalysis {
    const lines = response.split('\n').filter(line => line.trim());
    
    // Extract recent news (lines that look like headlines)
    const recentNews = lines
      .filter(line => /^[\d•\-\*]/.test(line.trim()) && line.length > 20)
      .map(line => line.replace(/^[\d•\-\*\.\)]+\s*/, '').trim())
      .slice(0, 4);

    // Detect outlook
    const lowerResponse = response.toLowerCase();
    let outlook: 'positive' | 'negative' | 'neutral' = 'neutral';
    
    if (lowerResponse.includes('buy') || lowerResponse.includes('bullish') || lowerResponse.includes('positive outlook')) {
      outlook = 'positive';
    } else if (lowerResponse.includes('sell') || lowerResponse.includes('bearish') || lowerResponse.includes('negative outlook')) {
      outlook = 'negative';
    }

    // Try to extract price (pattern: $XXX.XX)
    const priceMatch = response.match(/\$[\d,]+\.?\d*/);
    const currentPrice = priceMatch ? parseFloat(priceMatch[0].replace(/[$,]/g, '')) : undefined;

    return {
      symbol: symbol.toUpperCase(),
      companyName: symbol.toUpperCase(), // Would need additional lookup for full name
      currentPrice,
      analysis: response.slice(0, 500),
      recentNews,
      outlook,
    };
  }
}





