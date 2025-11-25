"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";

interface WatchlistItem {
  id: number;
  symbol: string;
  notes: string | null;
  target_price: number | null;
  alert_above: number | null;
  alert_below: number | null;
  alerts_enabled: boolean;
  added_at: string;
}

interface PortfolioCategory {
  id: string;
  name: string;
  description: string;
  emoji: string;
  tickers: string[];
  target_allocation: number;
}

interface MarketDataPoint {
  symbol: string;
  name: string;
  price: number;
  change_amount: number;
  change_percent: number;
  volume: number;
  market_cap: number;
  performance_30d: number | null;
  performance_90d: number | null;
  performance_365d: number | null;
}

interface NewsItem {
  id: number;
  symbol: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  published_at: string;
  is_significant: boolean;
}

interface MarketsClientProps {
  watchlist: WatchlistItem[];
  categories: PortfolioCategory[];
  marketData: Record<string, MarketDataPoint>;
  news: NewsItem[];
}

export default function MarketsClient({
  watchlist: initialWatchlist,
  categories,
  marketData: initialMarketData,
  news,
}: MarketsClientProps) {
  const [watchlist, setWatchlist] = useState(initialWatchlist);
  const [marketData, setMarketData] = useState(initialMarketData);
  const [addSymbol, setAddSymbol] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"watchlist" | "thesis" | "news">("watchlist");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddToWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSymbol.trim()) return;

    setIsAdding(true);
    try {
      const response = await fetch("/api/market/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: addSymbol.trim().toUpperCase() }),
      });

      if (response.ok) {
        showNotification("success", `${addSymbol.toUpperCase()} added to watchlist`);
        setAddSymbol("");
        // Refresh the page to get updated data
        window.location.reload();
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to add symbol");
      }
    } catch (error) {
      showNotification("error", error instanceof Error ? error.message : "Failed to add symbol");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveFromWatchlist = async (symbol: string) => {
    try {
      const response = await fetch("/api/market/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });

      if (response.ok) {
        setWatchlist(watchlist.filter((w) => w.symbol !== symbol));
        showNotification("success", `${symbol} removed from watchlist`);
      } else {
        throw new Error("Failed to remove symbol");
      }
    } catch (error) {
      showNotification("error", "Failed to remove symbol");
    }
  };

  const handleRefreshPrices = async () => {
    if (watchlist.length === 0) return;

    setIsRefreshing(true);
    try {
      const symbols = watchlist.map((w) => w.symbol).join(",");
      const response = await fetch(`/api/market/quote?symbols=${symbols}`);

      if (response.ok) {
        const data = await response.json();
        const newMarketData: Record<string, MarketDataPoint> = {};
        data.quotes?.forEach((q: any) => {
          newMarketData[q.symbol] = {
            symbol: q.symbol,
            name: q.name,
            price: q.price,
            change_amount: q.change,
            change_percent: q.changePercent,
            volume: q.volume,
            market_cap: q.marketCap,
            performance_30d: q.performance?.["30d"],
            performance_90d: q.performance?.["90d"],
            performance_365d: q.performance?.["365d"],
          };
        });
        setMarketData(newMarketData);
        showNotification("success", "Prices refreshed");
      }
    } catch (error) {
      showNotification("error", "Failed to refresh prices");
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "—";
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatMarketCap = (value: number | null | undefined) => {
    if (!value) return "—";
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    return formatCurrency(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Markets</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Track stocks and manage your watchlist</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefreshPrices}
                disabled={isRefreshing || watchlist.length === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <svg className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </button>
              <Link
                href="/investments"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                My Portfolio
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className={`p-4 rounded-lg ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}>
            {notification.message}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "watchlist", label: "📈 Watchlist", count: watchlist.length },
              { id: "thesis", label: "🎯 Investment Thesis", count: categories.length },
              { id: "news", label: "📰 News", count: news.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Watchlist Tab */}
        {activeTab === "watchlist" && (
          <div className="py-6 space-y-6">
            {/* Add Symbol Form */}
            <form onSubmit={handleAddToWatchlist} className="flex gap-3">
              <input
                type="text"
                value={addSymbol}
                onChange={(e) => setAddSymbol(e.target.value.toUpperCase())}
                placeholder="Enter ticker symbol (e.g., AAPL)"
                className="flex-1 max-w-xs px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
              />
              <button
                type="submit"
                disabled={isAdding || !addSymbol.trim()}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isAdding ? "Adding..." : "Add to Watchlist"}
              </button>
            </form>

            {/* Watchlist Table */}
            {watchlist.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Symbol</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Change</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">30D</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">90D</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Market Cap</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {watchlist.map((item) => {
                      const data = marketData[item.symbol];
                      const isUp = (data?.change_percent ?? 0) >= 0;
                      return (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">{item.symbol}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{data?.name || "—"}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900 dark:text-white">
                            {formatCurrency(data?.price)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${isUp ? "text-green-600" : "text-red-600"}`}>
                            {formatPercent(data?.change_percent)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-right text-sm ${(data?.performance_30d ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatPercent(data?.performance_30d)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-right text-sm ${(data?.performance_90d ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatPercent(data?.performance_90d)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-400">
                            {formatMarketCap(data?.market_cap)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleRemoveFromWatchlist(item.symbol)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No stocks in your watchlist</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Add ticker symbols above to start tracking stocks</p>
              </div>
            )}
          </div>
        )}

        {/* Investment Thesis Tab */}
        {activeTab === "thesis" && (
          <div className="py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{category.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{category.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{category.target_allocation}% allocation</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{category.description}</p>
                <div className="flex flex-wrap gap-2">
                  {category.tickers.map((ticker) => (
                    <span
                      key={ticker}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-mono"
                    >
                      {ticker}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => {
                    category.tickers.forEach((ticker) => {
                      if (!watchlist.find((w) => w.symbol === ticker)) {
                        fetch("/api/market/watchlist", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ symbol: ticker }),
                        });
                      }
                    });
                    showNotification("success", `Added ${category.tickers.length} stocks to watchlist`);
                    setTimeout(() => window.location.reload(), 1500);
                  }}
                  className="mt-4 w-full py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-600 dark:border-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                >
                  Add All to Watchlist
                </button>
              </div>
            ))}
          </div>
        )}

        {/* News Tab */}
        {activeTab === "news" && (
          <div className="py-6 space-y-4">
            {news.length > 0 ? (
              news.map((article) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">
                          {article.symbol}
                        </span>
                        {article.is_significant && (
                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs font-medium">
                            ⚡ Significant
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">{article.source}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{article.headline}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{article.summary}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {format(new Date(article.published_at), "MMM d, h:mm a")}
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="text-4xl mb-4">📰</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No news yet</h3>
                <p className="text-gray-500 dark:text-gray-400">Add stocks to your watchlist to receive relevant news</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
