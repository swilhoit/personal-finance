import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function QuickStats() {
  const supabase = await createSupabaseServerClient(true);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get current month dates
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  // Fetch stats in parallel - using teller_accounts instead of plaid_accounts
  const [accountsResult, monthSpendResult, transactionsResult] = await Promise.all([
    supabase
      .from("teller_accounts")
      .select("current_balance")
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .gte("date", startOfMonth)
      .lte("date", endOfMonth),
    supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
  ]);

  const totalBalance = (accountsResult.data ?? [])
    .reduce((sum, acc) => sum + (acc.current_balance ?? 0), 0);

  // Only sum negative amounts (expenses) - positive amounts are income
  const monthSpend = (monthSpendResult.data ?? [])
    .filter(t => (t.amount ?? 0) < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount ?? 0), 0);

  const avgDaily = monthSpend / new Date().getDate();

  const last30Days = (transactionsResult.data ?? [])
    .filter(t => (t.amount ?? 0) < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount ?? 0), 0);

  const stats = [
    {
      label: "Total Balance",
      value: totalBalance,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "This Month",
      value: monthSpend,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: "Daily Average",
      value: avgDaily,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      label: "Last 30 Days",
      value: last30Days,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-400 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-gray-100 rounded-lg text-gray-700">
              {stat.icon}
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">
            {stat.label}
          </p>
          <p className="text-2xl font-semibold text-gray-900">
            ${stat.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
      ))}
    </div>
  );
}
