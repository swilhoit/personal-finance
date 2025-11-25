/**
 * News Monitoring Service
 * Fetches market news from Finnhub API
 */

import type { SupabaseClient } from '@supabase/supabase-js';

const FINNHUB_API_BASE = 'https://finnhub.io/api/v1';

interface SavedNewsArticle {
  id: string;
  article_id: number;
  symbol: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image_url?: string;
  published_at: string;
  category: string;
  is_significant: boolean;
  created_at: string;
}

export interface NewsArticle {
  id: number;
  category: string;
  datetime: number;
  headline: string;
  image?: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface NewsSentiment {
  symbol: string;
  buzz: {
    articlesInLastWeek: number;
    weeklyAverage: number;
    buzz: number;
  };
  sentiment: {
    bullishPercent: number;
    bearishPercent: number;
  };
}

export class NewsService {
  private apiKey: string;
  private supabase: SupabaseClient;
  private seenArticles: Set<number> = new Set();
  private readonly MAX_SEEN_ARTICLES = 1000;

  constructor(apiKey: string, supabase: SupabaseClient) {
    this.apiKey = apiKey;
    this.supabase = supabase;
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${FINNHUB_API_BASE}${endpoint}`);
    url.searchParams.set('token', this.apiKey);
    
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Fetch company news for a ticker
   */
  async fetchCompanyNews(symbol: string, days: number = 7): Promise<NewsArticle[]> {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const to = new Date().toISOString().split('T')[0];

    try {
      return await this.makeRequest<NewsArticle[]>('/company-news', {
        symbol,
        from,
        to,
      });
    } catch (error) {
      console.error(`Error fetching news for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Fetch general market news
   */
  async fetchMarketNews(category: string = 'general'): Promise<NewsArticle[]> {
    try {
      return await this.makeRequest<NewsArticle[]>('/news', { category });
    } catch (error) {
      console.error('Error fetching market news:', error);
      return [];
    }
  }

  /**
   * Fetch news sentiment for a ticker
   */
  async fetchNewsSentiment(symbol: string): Promise<NewsSentiment | null> {
    try {
      return await this.makeRequest<NewsSentiment>('/news-sentiment', { symbol });
    } catch (error) {
      console.error(`Error fetching sentiment for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Check for new news and save to database
   */
  async fetchAndSaveNews(symbols: string[]): Promise<Map<string, NewsArticle[]>> {
    const newsBySymbol = new Map<string, NewsArticle[]>();

    for (const symbol of symbols) {
      try {
        const news = await this.fetchCompanyNews(symbol);

        // Filter out articles we've already seen
        const newArticles = news.filter(article => {
          if (this.seenArticles.has(article.id)) {
            return false;
          }
          this.seenArticles.add(article.id);
          return true;
        });

        if (newArticles.length > 0) {
          newsBySymbol.set(symbol, newArticles);

          // Save to database
          for (const article of newArticles) {
            await this.saveArticle(symbol, article);
          }
        }

        // Rate limit
        await new Promise(r => setTimeout(r, 100));
      } catch (error) {
        console.error(`Error processing news for ${symbol}:`, error);
      }
    }

    // Clean up seen articles cache if too large
    if (this.seenArticles.size > this.MAX_SEEN_ARTICLES) {
      const excess = this.seenArticles.size - this.MAX_SEEN_ARTICLES;
      const iterator = this.seenArticles.values();
      for (let i = 0; i < excess; i++) {
        const value = iterator.next().value;
        if (value !== undefined) {
          this.seenArticles.delete(value);
        }
      }
    }

    return newsBySymbol;
  }

  /**
   * Save article to database
   */
  private async saveArticle(symbol: string, article: NewsArticle): Promise<void> {
    try {
      await this.supabase.from('market_news').upsert({
        article_id: article.id,
        symbol,
        headline: article.headline,
        summary: article.summary,
        source: article.source,
        url: article.url,
        image_url: article.image,
        published_at: new Date(article.datetime * 1000).toISOString(),
        category: article.category,
        is_significant: this.isSignificantNews(article),
      }, { onConflict: 'article_id' });
    } catch (error) {
      console.warn(`Failed to save article ${article.id}:`, error);
    }
  }

  /**
   * Determine if news is significant (for alerting)
   */
  isSignificantNews(article: NewsArticle): boolean {
    const significantKeywords = [
      'merger', 'acquisition', 'buyout', 'deal',
      'earnings', 'revenue', 'profit', 'loss',
      'contract', 'award', 'partnership',
      'fda', 'approval', 'recall',
      'bankruptcy', 'lawsuit', 'investigation',
      'breakthrough', 'discovery', 'innovation',
      'nuclear', 'uranium', 'reactor', 'energy',
      'data center', 'ai infrastructure', 'grid',
    ];

    const text = `${article.headline} ${article.summary}`.toLowerCase();
    return significantKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Get recent significant news from database
   */
  async getSignificantNews(days: number = 7, limit: number = 20): Promise<SavedNewsArticle[]> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await this.supabase
      .from('market_news')
      .select('*')
      .eq('is_significant', true)
      .gte('published_at', cutoff)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching significant news:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get news for a specific symbol
   */
  async getNewsForSymbol(symbol: string, days: number = 7): Promise<SavedNewsArticle[]> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await this.supabase
      .from('market_news')
      .select('*')
      .eq('symbol', symbol)
      .gte('published_at', cutoff)
      .order('published_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error(`Error fetching news for ${symbol}:`, error);
      return [];
    }

    return data || [];
  }
}


