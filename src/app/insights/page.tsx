import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SpendingTrendChart from "@/components/SpendingTrendChart";
import RadialProgress from "@/components/RadialProgress";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import Link from "next/link";

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
    "#374151", "#4b5563", "#6b7280", "#9ca3af", "#d1d5db", "#e5e7eb"
  ];

  const categoryData = topCategories.map((cat, index) => ({
    name: cat.category_name || "Uncategorized",
    amount: cat.total_amount || 0,
    percentage: total > 0 ? ((cat.total_amount || 0) / total) * 100 : 0,
    color: categoryColors[index % categoryColors.length]
  }));

  // Prepare spending trend data (daily aggregation for last 30 days)
  const dailySpending = new Map<string, number>();

  (allTransactions as Transaction[] ?? []).forEach(tx => {
    if (tx.amount < 0) {
      const date = tx.date.slice(0, 10);
      dailySpending.set(date, (dailySpending.get(date) || 0) + Math.abs(tx.amount));
    }
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
    .filter(tx => new Date(tx.date) >= thisWeek && tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const lastWeekSpending = transactions
    .filter(tx => new Date(tx.date) >= lastWeek && new Date(tx.date) < thisWeek && tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const weekChange = lastWeekSpending > 0
    ? ((thisWeekSpending - lastWeekSpending) / lastWeekSpending) * 100
    : 0;

  // Get top merchants
  const merchantSpending = new Map<string, number>();
  transactions.forEach(tx => {
    if (tx.merchant_name && tx.amount < 0) {
      merchantSpending.set(tx.merchant_name, (merchantSpending.get(tx.merchant_name) || 0) + Math.abs(tx.amount));
    }
  });

  const topMerchants = Array.from(merchantSpending.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Financial Insights</h1>
              <p className="text-sm text-gray-500 mt-1">{currentMonth}</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No data yet</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              Connect your accounts to see spending insights and analytics.
            </p>
            <Link
              href="/accounts"
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Connect Account
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Spent</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    weekChange > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {weekChange > 0 ? '+' : ''}{weekChange.toFixed(1)}%
                  </span>
                </div>
                <p className="text-2xl font-semibold text-gray-900">
                  ${total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Transaction</span>
                  <span className="text-xs text-gray-400">{totalTransactions} total</span>
                </div>
                <p className="text-2xl font-semibold text-gray-900">
                  ${avgTransaction.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Top Category</span>
                  <span className="text-xs text-gray-400">#{rows.length} categories</span>
                </div>
                <p className="text-lg font-semibold text-gray-900 truncate">
                  {topCategories[0]?.category_name || "N/A"}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Daily Avg</span>
                </div>
                <p className="text-2xl font-semibold text-gray-900">
                  ${(total / 30).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5 col-span-2 md:col-span-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Top Merchant</span>
                </div>
                <p className="text-base font-semibold text-gray-900 truncate">
                  {topMerchants[0]?.[0] || "N/A"}
                </p>
              </div>
            </div>

            {/* Spending Trend and Budget Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-base font-semibold text-gray-900">Spending Trend</h2>
                  <select className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Last 30 days</option>
                    <option>Last 7 days</option>
                    <option>This month</option>
                  </select>
                </div>
                <SpendingTrendChart data={trendData} height={250} />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-6">Budget Status</h2>
                <div className="flex flex-col items-center">
                  <RadialProgress
                    value={total}
                    max={totalBudget || total * 1.2}
                    size={140}
                    strokeWidth={10}
                    color={budgetUsed > 100 ? "#dc2626" : budgetUsed > 80 ? "#f59e0b" : "#16a34a"}
                  />
                  <div className="mt-6 w-full space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Spent</span>
                      <span className="font-medium text-gray-900">${total.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Budget</span>
                      <span className="font-medium text-gray-900">${totalBudget.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-3 border-t border-gray-100">
                      <span className="text-gray-500">Remaining</span>
                      <span className={`font-semibold ${totalBudget - total < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${Math.abs(totalBudget - total).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold text-gray-900">Category Breakdown</h2>
                <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  View all
                </button>
              </div>
              <CategoryBreakdown categories={categoryData} />
            </div>

            {/* Top Merchants and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Top Merchants</h3>
                <div className="space-y-3">
                  {topMerchants.map(([merchant, amount], index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{merchant}</p>
                          <p className="text-xs text-gray-500">
                            {transactions.filter(t => t.merchant_name === merchant).length} transactions
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                        <p className="text-xs text-gray-500">
                          {((amount / total) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                  {topMerchants.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No merchant data available</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link href="/transactions" className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Review Transactions</p>
                        <p className="text-xs text-gray-500">Check recent activity</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  <Link href="/chat" className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Ask AI Assistant</p>
                        <p className="text-xs text-gray-500">Get personalized advice</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  <Link href="/accounts" className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Manage Accounts</p>
                        <p className="text-xs text-gray-500">Add or sync accounts</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
