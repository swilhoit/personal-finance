"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";

interface Holding {
  id: string;
  symbol: string;
  shares: number;
  cost_basis: number | null;
  purchase_date: string | null;
  account_name: string | null;
  notes: string | null;
}

interface MarketDataPoint {
  symbol: string;
  name: string;
  price: number;
  change_percent: number;
  performance_30d: number | null;
}

interface Analysis {
  id: number;
  week_start: string;
  week_end: string;
  title: string;
  executive_summary: string;
  recommendations: string[];
  key_metrics: Record<string, unknown>;
}

interface Category {
  id: string;
  name: string;
  emoji: string;
  tickers: string[];
  target_allocation: number;
}

interface InvestmentsClientProps {
  holdings: Holding[];
  marketData: Record<string, MarketDataPoint>;
  analyses: Analysis[];
  categories: Category[];
}

export default function InvestmentsClient({
  holdings: initialHoldings,
  marketData,
  analyses,
  categories,
}: InvestmentsClientProps) {
  const [holdings, setHoldings] = useState(initialHoldings);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    symbol: "",
    shares: "",
    costBasis: "",
    purchaseDate: "",
    accountName: "",
    notes: "",
  });

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Calculate portfolio totals
  const portfolioStats = holdings.reduce(
    (acc, holding) => {
      const data = marketData[holding.symbol];
      const currentValue = data ? data.price * holding.shares : 0;
      const costBasis = (holding.cost_basis || 0) * holding.shares;
      
      return {
        totalValue: acc.totalValue + currentValue,
        totalCost: acc.totalCost + costBasis,
        positions: acc.positions + 1,
      };
    },
    { totalValue: 0, totalCost: 0, positions: 0 }
  );

  const totalGainLoss = portfolioStats.totalValue - portfolioStats.totalCost;
  const totalGainLossPercent = portfolioStats.totalCost > 0 
    ? ((portfolioStats.totalValue - portfolioStats.totalCost) / portfolioStats.totalCost) * 100 
    : 0;

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/investments/holdings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: formData.symbol.toUpperCase(),
          shares: parseFloat(formData.shares),
          costBasis: formData.costBasis ? parseFloat(formData.costBasis) : null,
          purchaseDate: formData.purchaseDate || null,
          accountName: formData.accountName || null,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        showNotification("success", `Added ${formData.symbol.toUpperCase()} to portfolio`);
        setShowAddModal(false);
        setFormData({ symbol: "", shares: "", costBasis: "", purchaseDate: "", accountName: "", notes: "" });
        window.location.reload();
      } else {
        throw new Error("Failed to add holding");
      }
    } catch {
      showNotification("error", "Failed to add holding");
    }
  };

  const handleDeleteHolding = async (id: string, symbol: string) => {
    if (!confirm(`Remove ${symbol} from your portfolio?`)) return;

    try {
      const response = await fetch(`/api/investments/holdings?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setHoldings(holdings.filter((h) => h.id !== id));
        showNotification("success", `Removed ${symbol} from portfolio`);
      } else {
        throw new Error("Failed to remove holding");
      }
    } catch {
      showNotification("error", "Failed to remove holding");
    }
  };

  const handleGenerateAnalysis = async () => {
    setIsGeneratingAnalysis(true);
    try {
      const response = await fetch("/api/market/analysis", { method: "POST" });
      
      if (response.ok) {
        showNotification("success", "Analysis generated! Refreshing...");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error("Failed to generate analysis");
      }
    } catch {
      showNotification("error", "Failed to generate analysis");
    } finally {
      setIsGeneratingAnalysis(false);
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

  // Group holdings by category
  const holdingsByCategory = categories.map((category) => ({
    ...category,
    holdings: holdings.filter((h) => category.tickers.includes(h.symbol)),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
                <p className="text-sm text-gray-600">Manage your investment holdings</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/markets"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Markets
              </Link>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                + Add Holding
              </button>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total Value</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(portfolioStats.totalValue)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total Cost</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(portfolioStats.totalCost)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total Gain/Loss</p>
            <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(totalGainLoss)}
            </p>
            <p className={`text-sm ${totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatPercent(totalGainLossPercent)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Positions</p>
            <p className="text-2xl font-bold text-gray-900">{portfolioStats.positions}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Holdings Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Holdings</h2>
              </div>

              {holdings.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Shares</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gain/Loss</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {holdings.map((holding) => {
                      const data = marketData[holding.symbol];
                      const currentValue = data ? data.price * holding.shares : 0;
                      const costBasis = (holding.cost_basis || 0) * holding.shares;
                      const gainLoss = currentValue - costBasis;
                      const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

                      return (
                        <tr key={holding.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold text-gray-900">{holding.symbol}</div>
                            <div className="text-xs text-gray-500">{holding.account_name || "Default"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                            {holding.shares.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900">
                            {data ? formatCurrency(data.price) : "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                            {formatCurrency(currentValue)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${gainLoss >= 0 ? "text-green-600" : "text-red-600"}`}>
                            <div>{formatCurrency(gainLoss)}</div>
                            <div className="text-xs">{formatPercent(gainLossPercent)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleDeleteHolding(holding.id, holding.symbol)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-4">💼</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No holdings yet</h3>
                  <p className="text-gray-500 mb-4">Add your first investment to track your portfolio</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Add Holding
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Analysis Sidebar */}
          <div className="space-y-6">
            {/* Generate Analysis */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">📊 Weekly Analysis</h3>
              <p className="text-sm text-indigo-100 mb-4">
                Get AI-powered insights on your portfolio and spending
              </p>
              <button
                onClick={handleGenerateAnalysis}
                disabled={isGeneratingAnalysis}
                className="w-full py-2 bg-white text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 disabled:opacity-50 transition-colors"
              >
                {isGeneratingAnalysis ? "Generating..." : "Generate Analysis"}
              </button>
            </div>

            {/* Recent Analyses */}
            {analyses.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Recent Reports</h3>
                <div className="space-y-4">
                  {analyses.map((analysis) => (
                    <div key={analysis.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="text-sm font-medium text-gray-900">{analysis.title}</div>
                      <div className="text-xs text-gray-500 mb-2">
                        {format(new Date(analysis.week_start), "MMM d")} - {format(new Date(analysis.week_end), "MMM d, yyyy")}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {analysis.executive_summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Allocation by Category */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Allocation by Thesis</h3>
              <div className="space-y-3">
                {holdingsByCategory.filter(c => c.holdings.length > 0).map((category) => {
                  const categoryValue = category.holdings.reduce((sum, h) => {
                    const data = marketData[h.symbol];
                    return sum + (data ? data.price * h.shares : 0);
                  }, 0);
                  const percentage = portfolioStats.totalValue > 0
                    ? (categoryValue / portfolioStats.totalValue) * 100
                    : 0;

                  return (
                    <div key={category.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700">
                          {category.emoji} {category.name}
                        </span>
                        <span className="font-medium text-gray-900">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Holding Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Add Holding</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddHolding} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symbol *</label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  placeholder="e.g., AAPL"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shares *</label>
                <input
                  type="number"
                  value={formData.shares}
                  onChange={(e) => setFormData({ ...formData, shares: e.target.value })}
                  placeholder="100"
                  step="any"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Basis (per share)</label>
                <input
                  type="number"
                  value={formData.costBasis}
                  onChange={(e) => setFormData({ ...formData, costBasis: e.target.value })}
                  placeholder="150.00"
                  step="any"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="e.g., Fidelity IRA"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Add Holding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
