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
    "#06b6d4", "#14b8a6", "#0ea5e9", "#06b6d4", "#0891b2", "#0e7490",
    "#0d9488", "#10b981", "#059669", "#047857"
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-dm-mono font-black flex items-center gap-3">
                <span className="text-5xl">📊</span>
                INSIGHTS UNLOCKED
              </h1>
              <p className="text-white/90 mt-2 font-dm-mono text-sm">
                LEVEL {new Date().getMonth() + 1} • {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
              </p>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-3 bg-white/20 backdrop-blur rounded-xl hover:bg-white/30 transition-all font-dm-mono text-sm flex items-center gap-2">
                <span>📥</span> EXPORT
              </button>
              <button className="px-6 py-3 bg-white/20 backdrop-blur rounded-xl hover:bg-white/30 transition-all font-dm-mono text-sm flex items-center gap-2">
                <span>⚙️</span> FILTER
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {rows.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-2xl border-4 border-cyan-400 p-12 text-center">
            <div className="text-8xl mb-6 animate-bounce">📈</div>
            <h2 className="text-3xl font-dm-mono font-black mb-3 bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
              NO DATA YET!
            </h2>
            <p className="text-gray-600 text-gray-400 mb-8 max-w-md mx-auto font-dm-mono">
              Connect your accounts to unlock epic insights! 🚀
            </p>
            <a href="/accounts" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-2xl hover:scale-105 transition-all font-dm-mono shadow-lg hover:shadow-cyan-500/50">
              <span className="text-xl">🔗</span>
              CONNECT ACCOUNT
            </a>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-2xl shadow-lg border-4 border-cyan-400 p-6 hover:scale-105 transition-transform">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">💰</div>
                  <span className={`text-xs font-dm-mono px-2 py-1 rounded-full ${weekChange > 0 ? 'bg-red-100 bg-red-900/30 text-red-600' : 'bg-green-100 bg-green-900/30 text-green-600'}`}>
                    {weekChange > 0 ? '📈' : '📉'} {Math.abs(weekChange).toFixed(1)}%
                  </span>
                </div>
                <p className="text-2xl font-dm-mono font-black mb-1 text-cyan-600 text-cyan-400">${total.toFixed(0)}</p>
                <p className="text-xs font-dm-mono text-gray-500">TOTAL SPENT</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border-4 border-sky-400 p-6 hover:scale-105 transition-transform">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">🎯</div>
                  <span className="text-xs font-dm-mono text-sky-600">
                    x{totalTransactions}
                  </span>
                </div>
                <p className="text-2xl font-dm-mono font-black mb-1 text-sky-600 text-sky-400">${avgTransaction.toFixed(0)}</p>
                <p className="text-xs font-dm-mono text-gray-500">AVG TRANSACTION</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border-4 border-teal-400 p-6 hover:scale-105 transition-transform">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">🏆</div>
                  <span className="text-xs font-dm-mono text-teal-600">
                    #{rows.length}
                  </span>
                </div>
                <p className="text-lg font-dm-mono font-black mb-1 text-teal-600 text-teal-400">{topCategories[0]?.category_name || "N/A"}</p>
                <p className="text-xs font-dm-mono text-gray-500">TOP CATEGORY</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border-4 border-orange-400 p-6 hover:scale-105 transition-transform">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">📅</div>
                  <span className="text-xs font-dm-mono text-orange-600">
                    DAILY
                  </span>
                </div>
                <p className="text-2xl font-dm-mono font-black mb-1 text-orange-600 text-orange-400">${(total / 30).toFixed(0)}</p>
                <p className="text-xs font-dm-mono text-gray-500">AVG DAILY</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border-4 border-purple-400 p-6 hover:scale-105 transition-transform">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-3xl">🏪</div>
                  <span className="text-xs font-dm-mono text-purple-600">
                    TOP
                  </span>
                </div>
                <p className="text-sm font-dm-mono font-black mb-1 text-purple-600 text-purple-400 truncate">{topMerchants[0]?.[0] || "N/A"}</p>
                <p className="text-xs font-dm-mono text-gray-500">FAV MERCHANT</p>
              </div>
            </div>

            {/* Spending Trend and Budget Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border-4 border-cyan-400 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-dm-mono font-black text-cyan-600 text-cyan-400">📈 SPENDING TREND</h2>
                  <select className="text-sm px-3 py-2 border-2 border-cyan-400 rounded-xl bg-white font-dm-mono text-cyan-700">
                    <option>LAST 30 DAYS</option>
                    <option>LAST 7 DAYS</option>
                    <option>THIS MONTH</option>
                  </select>
                </div>
                <SpendingTrendChart data={trendData} height={250} />
              </div>

              <div className="bg-white rounded-2xl shadow-lg border-4 border-teal-400 p-6">
                <h2 className="text-xl font-dm-mono font-black mb-6 text-teal-600 text-teal-400">💪 BUDGET POWER</h2>
                <div className="flex flex-col items-center">
                  <RadialProgress 
                    value={total} 
                    max={totalBudget || total * 1.2} 
                    size={160}
                    strokeWidth={12}
                    color={budgetUsed > 100 ? "#dc2626" : budgetUsed > 80 ? "#ea580c" : "#16a34a"}
                  />
                  <div className="mt-6 w-full space-y-3">
                    <div className="flex justify-between text-sm font-dm-mono">
                      <span className="text-gray-500">SPENT</span>
                      <span className="font-bold text-cyan-600 text-cyan-400">${total.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-dm-mono">
                      <span className="text-gray-500">BUDGET</span>
                      <span className="font-bold text-teal-600 text-teal-400">${totalBudget.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-3 border-t-2 border-gray-200 border-gray-800 font-dm-mono">
                      <span className="text-gray-500">REMAINING</span>
                      <span className={`font-bold ${totalBudget - total < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {totalBudget - total < 0 ? '⚠️' : '✅'} ${Math.abs(totalBudget - total).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-2xl shadow-lg border-4 border-sky-400 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-dm-mono font-black text-sky-600 text-sky-400">🎯 CATEGORY BREAKDOWN</h2>
                <button className="text-sm font-dm-mono text-sky-600 text-sky-400 hover:text-sky-700 hover:text-sky-300 transition-colors">
                  VIEW ALL →
                </button>
              </div>
              <CategoryBreakdown categories={categoryData} />
            </div>

            {/* Top Merchants and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg border-4 border-purple-400 p-6">
                <h3 className="text-xl font-dm-mono font-black mb-4 text-purple-600 text-purple-400">🏪 TOP MERCHANTS</h3>
                <div className="space-y-3">
                  {topMerchants.map(([merchant, amount], index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 from-purple-900/20 to-pink-900/20 hover:scale-[1.02] transition-transform">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-dm-mono font-black">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-dm-mono text-sm">{merchant}</p>
                          <p className="text-xs text-gray-500">
                            {transactions.filter(t => t.merchant_name === merchant).length} visits
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-dm-mono font-black text-purple-600 text-purple-400">${amount.toFixed(0)}</p>
                        <p className="text-xs font-dm-mono text-gray-500">
                          {((amount / total) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-100 to-teal-100 rounded-2xl border-4 border-cyan-400 p-6">
                <h3 className="text-xl font-dm-mono font-black mb-4 text-cyan-600 text-cyan-400">⚡ QUICK ACTIONS</h3>
                <div className="space-y-3">
                  <a href="/budgets" className="flex items-center justify-between p-4 bg-white rounded-xl hover:scale-[1.02] transition-transform border-2 border-cyan-300">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">💎</div>
                      <div>
                        <p className="font-dm-mono font-black text-sm text-cyan-600 text-cyan-400">SET BUDGET</p>
                        <p className="text-xs font-dm-mono text-gray-500">Plan next month</p>
                      </div>
                    </div>
                    <span className="text-2xl">→</span>
                  </a>

                  <a href="/transactions" className="flex items-center justify-between p-4 bg-white rounded-xl hover:scale-[1.02] transition-transform border-2 border-teal-300">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">📝</div>
                      <div>
                        <p className="font-dm-mono font-black text-sm text-teal-600 text-teal-400">REVIEW</p>
                        <p className="text-xs font-dm-mono text-gray-500">Check transactions</p>
                      </div>
                    </div>
                    <span className="text-2xl">→</span>
                  </a>

                  <a href="/chat" className="flex items-center justify-between p-4 bg-white rounded-xl hover:scale-[1.02] transition-transform border-2 border-sky-300">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">🤖</div>
                      <div>
                        <p className="font-dm-mono font-black text-sm text-sky-600 text-sky-400">ASK AI</p>
                        <p className="text-xs font-dm-mono text-gray-500">Get tips</p>
                      </div>
                    </div>
                    <span className="text-2xl">→</span>
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