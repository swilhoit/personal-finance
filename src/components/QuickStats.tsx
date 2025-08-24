import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function QuickStats() {
  const supabase = await createSupabaseServerClient(true);
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  // Get current month dates
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  // Fetch stats in parallel
  const [accountsResult, monthSpendResult, transactionsResult] = await Promise.all([
    supabase
      .from("plaid_accounts")
      .select("current_balance")
      .eq("user_id", user.id),
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
  
  const monthSpend = (monthSpendResult.data ?? [])
    .reduce((sum, t) => sum + Math.abs(t.amount ?? 0), 0);
  
  const avgDaily = monthSpend / new Date().getDate();

  const last30Days = (transactionsResult.data ?? [])
    .reduce((sum, t) => sum + Math.abs(t.amount ?? 0), 0);

  const stats = [
    {
      label: "Total Balance",
      value: totalBalance,
      emoji: "💰",
      gradient: "from-cyan-400 to-teal-400",
      darkGradient: "dark:from-cyan-600 dark:to-teal-600",
    },
    {
      label: "This Month",
      value: monthSpend,
      emoji: "📊",
      gradient: "from-sky-400 to-cyan-400",
      darkGradient: "dark:from-sky-600 dark:to-cyan-600",
    },
    {
      label: "Daily Average",
      value: avgDaily,
      emoji: "📈",
      gradient: "from-teal-400 to-cyan-400",
      darkGradient: "dark:from-teal-600 dark:to-cyan-600",
    },
    {
      label: "Last 30 Days",
      value: last30Days,
      emoji: "📅",
      gradient: "from-cyan-400 to-sky-400",
      darkGradient: "dark:from-cyan-600 dark:to-sky-600",
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div 
          key={stat.label}
          className="relative group hover:scale-105 transition-transform"
        >
          {/* Glow effect */}
          <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity`}></div>
          
          {/* Card */}
          <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl border-2 border-cyan-400 dark:border-cyan-600 p-4 shadow-lg">
            <div className="flex items-start justify-between mb-2">
              <p className="font-['Rubik_Mono_One'] text-xs text-cyan-700 dark:text-cyan-300 uppercase">
                {stat.label}
              </p>
              <span className="text-2xl">{stat.emoji}</span>
            </div>
            <p className={`text-2xl font-['Bungee'] bg-gradient-to-r ${stat.gradient} ${stat.darkGradient} bg-clip-text text-transparent`}>
              ${stat.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}