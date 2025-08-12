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

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-xl p-4">
        <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Total Balance</p>
        <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
          ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
      
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-xl p-4">
        <p className="text-xs text-purple-700 dark:text-purple-300 mb-1">This Month</p>
        <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
          ${monthSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
      
      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-xl p-4">
        <p className="text-xs text-green-700 dark:text-green-300 mb-1">Daily Average</p>
        <p className="text-xl font-bold text-green-900 dark:text-green-100">
          ${avgDaily.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
      
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-xl p-4">
        <p className="text-xs text-orange-700 dark:text-orange-300 mb-1">Last 30 Days</p>
        <p className="text-xl font-bold text-orange-900 dark:text-orange-100">
          ${last30Days.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
}