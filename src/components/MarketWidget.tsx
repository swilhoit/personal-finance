"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface MarketWidgetProps {
  initialData?: WatchlistItem[];
}

export default function MarketWidget({ initialData = [] }: MarketWidgetProps) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(initialData);
  const [isLoading, setIsLoading] = useState(initialData.length === 0);

  useEffect(() => {
    if (initialData.length === 0) {
      fetchWatchlist();
    }
  }, [initialData.length]);

  const fetchWatchlist = async () => {
    try {
      const response = await fetch("/api/market/watchlist");
      if (response.ok) {
        const data = await response.json();
        setWatchlist(data.watchlist?.slice(0, 5) || []);
      }
    } catch (error) {
      console.error("Error fetching watchlist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Markets</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">📈 Markets</h3>
        <Link
          href="/markets"
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          View All →
        </Link>
      </div>

      {watchlist.length > 0 ? (
        <div className="space-y-3">
          {watchlist.map((item) => {
            const isUp = item.changePercent >= 0;
            return (
              <div
                key={item.symbol}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{item.symbol}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                    {item.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(item.price)}
                  </p>
                  <p className={`text-xs font-medium ${
                    isUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  }`}>
                    {isUp ? "▲" : "▼"} {formatPercent(item.changePercent)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
            No stocks in your watchlist
          </p>
          <Link
            href="/markets"
            className="inline-block px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            Add Stocks
          </Link>
        </div>
      )}
    </div>
  );
}

