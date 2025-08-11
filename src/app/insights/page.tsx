import { createSupabaseServerClient } from "@/lib/supabase/server";
import MiniBar from "@/components/MiniBar";
import { redirect } from "next/navigation";

type MonthSpendRow = {
  category_name: string | null;
  total_amount: number;
  txn_count: number;
};

export default async function InsightsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/sign-in");
  }

  const [{ data: monthByCat }, { data: recentTxs }] = await Promise.all([
    supabase
      .from("v_month_spend_by_category")
      .select("category_name, total_amount, txn_count")
      .eq("user_id", user.id),
    supabase
      .from("transactions")
      .select("amount, date")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(30)
  ]);

  const rows: MonthSpendRow[] = (monthByCat as MonthSpendRow[]) ?? [];
  const total = rows.reduce((sum, x) => sum + Number(x.total_amount || 0), 0);
  const totalTransactions = rows.reduce((sum, x) => sum + (x.txn_count || 0), 0);
  
  // Calculate average transaction
  const avgTransaction = totalTransactions > 0 ? total / totalTransactions : 0;
  
  // Sort categories by amount
  const sortedRows = [...rows].sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0));
  const topCategories = sortedRows.slice(0, 5);
  
  const chartData = rows.map((r) => ({ 
    label: r.category_name ?? "Uncategorized", 
    value: Number(r.total_amount || 0) 
  }));

  // Calculate daily spending trend for last 7 days
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  
  const recentSpending = (recentTxs ?? [])
    .filter(tx => new Date(tx.date) >= last7Days && tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-black">
      {/* Header */}
      <div className="bg-[#f5f0e8] dark:bg-zinc-900 border-b border-[#e8dfd2] dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-2xl font-bold">Insights</h1>
            <p className="text-sm text-[#7d6754] dark:text-zinc-400 mt-1">
              Understand your spending patterns and financial habits
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {rows.length === 0 ? (
          <div className="bg-[#f5f0e8] dark:bg-zinc-900 rounded-xl border border-[#e8dfd2] dark:border-zinc-800 p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-[#d4c4b0] dark:text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">No data available</h2>
            <p className="text-[#7d6754] dark:text-zinc-400 mb-6 max-w-sm mx-auto">
              Connect your bank account and sync transactions to see insights.
            </p>
            <a href="/dashboard" className="inline-flex items-center px-4 py-2 bg-[#3d3028] text-[#faf8f5] dark:bg-white dark:text-black rounded-lg hover:opacity-90 transition-opacity">
              Go to Dashboard
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#f5f0e8] dark:bg-zinc-900 rounded-xl border border-[#e8dfd2] dark:border-zinc-800 p-6">
                <p className="text-xs text-[#9b826f] dark:text-zinc-400 uppercase tracking-wider mb-2">Month to Date</p>
                <p className="text-2xl font-bold">${total.toFixed(2)}</p>
                <p className="text-xs text-[#7d6754] dark:text-zinc-400 mt-1">Total spending</p>
              </div>
              
              <div className="bg-[#f5f0e8] dark:bg-zinc-900 rounded-xl border border-[#e8dfd2] dark:border-zinc-800 p-6">
                <p className="text-xs text-[#9b826f] dark:text-zinc-400 uppercase tracking-wider mb-2">Transactions</p>
                <p className="text-2xl font-bold">{totalTransactions}</p>
                <p className="text-xs text-[#7d6754] dark:text-zinc-400 mt-1">This month</p>
              </div>
              
              <div className="bg-[#f5f0e8] dark:bg-zinc-900 rounded-xl border border-[#e8dfd2] dark:border-zinc-800 p-6">
                <p className="text-xs text-[#9b826f] dark:text-zinc-400 uppercase tracking-wider mb-2">Average</p>
                <p className="text-2xl font-bold">${avgTransaction.toFixed(2)}</p>
                <p className="text-xs text-[#7d6754] dark:text-zinc-400 mt-1">Per transaction</p>
              </div>
              
              <div className="bg-[#f5f0e8] dark:bg-zinc-900 rounded-xl border border-[#e8dfd2] dark:border-zinc-800 p-6">
                <p className="text-xs text-[#9b826f] dark:text-zinc-400 uppercase tracking-wider mb-2">Last 7 Days</p>
                <p className="text-2xl font-bold">${recentSpending.toFixed(2)}</p>
                <p className="text-xs text-[#7d6754] dark:text-zinc-400 mt-1">Recent spending</p>
              </div>
            </div>

            {/* Spending by Category Chart */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-lg font-semibold mb-4">Spending by Category</h2>
              <div className="space-y-4">
                <MiniBar data={chartData} />
                <div className="pt-4 border-t border-[#e8dfd2] dark:border-zinc-800">
                  <p className="text-sm text-[#7d6754] dark:text-zinc-400 mb-3">Top Categories</p>
                  <div className="space-y-2">
                    {topCategories.map((category, index) => {
                      const percentage = total > 0 ? (category.total_amount / total) * 100 : 0;
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#faf8f5] dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {category.category_name || "Uncategorized"}
                              </p>
                              <p className="text-xs text-[#9b826f] dark:text-zinc-400">
                                {category.txn_count} transactions
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${category.total_amount.toFixed(2)}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Insights Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#f5f0e8] dark:bg-zinc-900 rounded-xl border border-[#e8dfd2] dark:border-zinc-800 p-6">
                <h3 className="text-lg font-semibold mb-4">Spending Patterns</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#7a95a7] mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Most expensive category</p>
                      <p className="text-xs text-[#7d6754] dark:text-zinc-400">
                        {topCategories[0]?.category_name || "N/A"} - ${topCategories[0]?.total_amount.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#87a878] mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Most frequent</p>
                      <p className="text-xs text-[#7d6754] dark:text-zinc-400">
                        {sortedRows.sort((a, b) => b.txn_count - a.txn_count)[0]?.category_name || "N/A"} - {sortedRows[0]?.txn_count || 0} transactions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#d4a574] mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Categories tracked</p>
                      <p className="text-xs text-[#7d6754] dark:text-zinc-400">
                        {rows.length} active categories this month
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#f5f0e8] dark:bg-zinc-900 rounded-xl border border-[#e8dfd2] dark:border-zinc-800 p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <a href="/transactions" className="flex items-center justify-between p-3 rounded-lg border border-[#d4c4b0] dark:border-zinc-700 hover:bg-[#faf8f5] dark:hover:bg-zinc-800 transition-colors">
                    <span className="text-sm font-medium">Review transactions</span>
                    <svg className="w-4 h-4 text-[#9b826f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                  <a href="/categories" className="flex items-center justify-between p-3 rounded-lg border border-[#d4c4b0] dark:border-zinc-700 hover:bg-[#faf8f5] dark:hover:bg-zinc-800 transition-colors">
                    <span className="text-sm font-medium">Manage categories</span>
                    <svg className="w-4 h-4 text-[#9b826f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                  <a href="/chat" className="flex items-center justify-between p-3 rounded-lg border border-[#d4c4b0] dark:border-zinc-700 hover:bg-[#faf8f5] dark:hover:bg-zinc-800 transition-colors">
                    <span className="text-sm font-medium">Ask AI assistant</span>
                    <svg className="w-4 h-4 text-[#9b826f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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