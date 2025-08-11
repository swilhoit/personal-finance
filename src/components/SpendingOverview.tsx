import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SpendingOverview() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: monthSpending } = await supabase
    .from("v_month_spend_by_category")
    .select("category_name, total_amount, txn_count")
    .eq("user_id", user.id)
    .order("total_amount", { ascending: false })
    .limit(5);

  if (!monthSpending || monthSpending.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
        <svg className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm">No spending data yet</p>
        <p className="text-xs mt-1">Transactions will appear here once synced</p>
      </div>
    );
  }

  const total = monthSpending.reduce((sum, cat) => sum + Number(cat.total_amount ?? 0), 0);
  const maxAmount = Math.max(...monthSpending.map(cat => Number(cat.total_amount ?? 0)));

  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-pink-500"
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-bold">${total.toFixed(2)}</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">This month</p>
      </div>
      
      <div className="space-y-3">
        {monthSpending.map((cat, idx) => {
          const amount = Number(cat.total_amount ?? 0);
          const percentage = (amount / maxAmount) * 100;
          const percentOfTotal = (amount / total) * 100;
          
          return (
            <div key={cat.category_name ?? idx} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium truncate flex-1">
                  {cat.category_name ?? "Uncategorized"}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400 ml-2">
                  ${amount.toFixed(2)}
                </span>
              </div>
              <div className="relative h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`absolute inset-y-0 left-0 ${colors[idx % colors.length]} rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {percentOfTotal.toFixed(1)}% of total • {cat.txn_count} transactions
              </p>
            </div>
          );
        })}
      </div>
      
      <a 
        href="/insights" 
        className="block text-center py-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        View detailed insights →
      </a>
    </div>
  );
}