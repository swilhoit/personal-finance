import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SpendingTrendChart from "@/components/SpendingTrendChart";
import RadialProgress from "@/components/RadialProgress";
import CategoryBreakdown from "@/components/CategoryBreakdown";

type MonthSpendRow = {
  category_name: string | null;
  total_amount: number;
  txn_count: number;
};

type Transaction = {
  amount: number;
  date: string;
  category: string | null;
  merchant_name: string | null;
};

type Budget = {
  category_id: string;
  amount: number;
  categories: { name: string } | null;
};

export default async function InsightsPage() {
  const supabase = await createSupabaseServerClient(true);
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/sign-in");
  }

  // Fetch all necessary data
  const [
    { data: monthByCat }, 
    { data: recentTxs },
    { data: budgets },
    { data: allTransactions }
  ] = await Promise.all([
    supabase
      .from("v_month_spend_by_category")
      .select("category_name, total_amount, txn_count")
      .eq("user_id", user.id),
    supabase
      .from("transactions")
      .select("amount, date, category, merchant_name")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(100),
    supabase
      .from("budgets")
      .select("category_id, amount, categories(name)")
      .eq("user_id", user.id)
      .gte("month", new Date().toISOString().slice(0, 7)),
    supabase
      .from("transactions")
      .select("amount, date")
      .eq("user_id", user.id)
      .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
      .order("date", { ascending: true })
  ]);

  const rows: MonthSpendRow[] = (monthByCat as MonthSpendRow[]) ?? [];
  const transactions: Transaction[] = (recentTxs as Transaction[]) ?? [];
  const monthlyBudgets: Budget[] = (budgets as unknown as Budget[]) ?? [];
  
  // Calculate metrics
  const total = rows.reduce((sum, x) => sum + Number(x.total_amount || 0), 0);
  const totalTransactions = rows.reduce((sum, x) => sum + (x.txn_count || 0), 0);
  const avgTransaction = totalTransactions > 0 ? total / totalTransactions : 0;
  const totalBudget = monthlyBudgets.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const budgetUsed = totalBudget > 0 ? (total / totalBudget) * 100 : 0;
  
  // Sort and prepare category data
  const sortedRows = [...rows].sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0));
  const topCategories = sortedRows.slice(0, 6);
  
  // Prepare category breakdown with colors
  const categoryColors = [
    "#2563eb", "#16a34a", "#dc2626", "#ea580c", "#6b7280", "#374151",
    "#1f2937", "#111827", "#030712", "#6b7280"
  ];
  
  const categoryData = topCategories.map((cat, index) => ({
    name: cat.category_name || "Uncategorized",
    amount: cat.total_amount || 0,
    percentage: total > 0 ? ((cat.total_amount || 0) / total) * 100 : 0,
    color: categoryColors[index % categoryColors.length]
  }));

  // Prepare spending trend data (daily aggregation for last 30 days)
  const dailySpending = new Map<string, number>();
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  
  (allTransactions as Transaction[] ?? []).forEach(tx => {
    const date = tx.date.slice(0, 10);
    dailySpending.set(date, (dailySpending.get(date) || 0) + tx.amount);
  });
  
  const trendData = Array.from(dailySpending.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate week-over-week change
  const thisWeek = new Date();
  const lastWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - 7);
  lastWeek.setDate(lastWeek.getDate() - 14);
  
  const thisWeekSpending = transactions
    .filter(tx => new Date(tx.date) >= thisWeek)
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const lastWeekSpending = transactions
    .filter(tx => new Date(tx.date) >= lastWeek && new Date(tx.date) < thisWeek)
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const weekChange = lastWeekSpending > 0 
    ? ((thisWeekSpending - lastWeekSpending) / lastWeekSpending) * 100 
    : 0;

  // Get top merchants
  const merchantSpending = new Map<string, number>();
  transactions.forEach(tx => {
    if (tx.merchant_name) {
      merchantSpending.set(tx.merchant_name, (merchantSpending.get(tx.merchant_name) || 0) + tx.amount);
    }
  });
  
  const topMerchants = Array.from(merchantSpending.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Financial Insights</h1>
              <p className="text-white/80 mt-2">
                Your spending analysis for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-white/10 dark:bg-white/20 backdrop-blur rounded-lg hover:bg-white/20 dark:hover:bg-white/30 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              <button className="px-4 py-2 bg-white/10 dark:bg-white/20 backdrop-blur rounded-lg hover:bg-white/20 dark:hover:bg-white/30 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {rows.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border border-gray-200 dark:border-zinc-800 p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-600/20 to-green-600/20 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">No Data Available Yet</h2>
            <p className="text-gray-600 dark:text-zinc-400 mb-8 max-w-md mx-auto">
              Connect your bank accounts and sync transactions to unlock powerful spending insights and analytics.
            </p>
            <a href="/accounts" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-green-600 text-white rounded-xl hover:shadow-lg transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Connect Account
            </a>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-blue-600/10 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${weekChange > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {weekChange > 0 ? '+' : ''}{weekChange.toFixed(1)}%
                  </span>
                </div>
                <p className="text-2xl font-bold mb-1">${total.toFixed(2)}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Total Spending</p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-green-600/10 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-green-600">
                    {totalTransactions}
                  </span>
                </div>
                <p className="text-2xl font-bold mb-1">${avgTransaction.toFixed(2)}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Avg Transaction</p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-red-600/10 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-red-600">
                    {rows.length}
                  </span>
                </div>
                <p className="text-2xl font-bold mb-1">{topCategories[0]?.category_name || "N/A"}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Top Category</p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-orange-600/10 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-orange-600">
                    Daily
                  </span>
                </div>
                <p className="text-2xl font-bold mb-1">${(total / 30).toFixed(2)}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Avg Daily Spend</p>
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-gray-500/10 rounded-lg">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    {topMerchants.length}
                  </span>
                </div>
                <p className="text-lg font-bold mb-1">{topMerchants[0]?.[0] || "N/A"}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Top Merchant</p>
              </div>
            </div>

            {/* Spending Trend and Budget Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Spending Trend</h2>
                  <select className="text-sm px-3 py-1 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-transparent">
                    <option>Last 30 days</option>
                    <option>Last 7 days</option>
                    <option>This month</option>
                  </select>
                </div>
                <SpendingTrendChart data={trendData} height={250} />
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6">
                <h2 className="text-lg font-semibold mb-6">Budget Status</h2>
                <div className="flex flex-col items-center">
                  <RadialProgress 
                    value={total} 
                    max={totalBudget || total * 1.2} 
                    size={160}
                    strokeWidth={12}
                    color={budgetUsed > 100 ? "#dc2626" : budgetUsed > 80 ? "#ea580c" : "#16a34a"}
                  />
                  <div className="mt-6 w-full space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-zinc-400">Spent</span>
                      <span className="font-semibold">${total.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-zinc-400">Budget</span>
                      <span className="font-semibold">${totalBudget.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-zinc-800">
                      <span className="text-gray-500 dark:text-zinc-400">Remaining</span>
                      <span className={`font-semibold ${totalBudget - total < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        ${Math.abs(totalBudget - total).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Category Breakdown</h2>
                <button className="text-sm text-blue-600 dark:text-blue-600 hover:text-blue-700 dark:hover:text-green-600 transition-colors">
                  View All →
                </button>
              </div>
              <CategoryBreakdown categories={categoryData} />
            </div>

            {/* Top Merchants and Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6">
                <h3 className="text-lg font-semibold mb-4">Top Merchants</h3>
                <div className="space-y-3">
                  {topMerchants.map(([merchant, amount], index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600/20 to-green-600/20 flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{merchant}</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-400">
                            {transactions.filter(t => t.merchant_name === merchant).length} visits
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">
                          {((amount / total) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-zinc-800 dark:to-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <a href="/budgets" className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg hover:shadow-md transition-all border border-gray-100 dark:border-transparent">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Set Budget Goals</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">Plan next month</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>

                  <a href="/transactions" className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg hover:shadow-md transition-all border border-gray-100 dark:border-transparent">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-600/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Review Transactions</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">Categorize & analyze</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>

                  <a href="/chat" className="flex items-center justify-between p-3 bg-white dark:bg-zinc-800 rounded-lg hover:shadow-md transition-all border border-gray-100 dark:border-transparent">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-600/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Ask AI Assistant</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400">Get personalized tips</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}