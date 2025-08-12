import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function RecentTransactionsList() {
  const supabase = await createSupabaseServerClient(true);
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: transactions } = await supabase
    .from("transactions")
    .select("transaction_id, date, name, merchant_name, amount, category, pending")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(5);

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
        <svg className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm">No transactions yet</p>
        <p className="text-xs mt-1">Connect a bank account to get started</p>
      </div>
    );
  }

  const formatAmount = (amount: number) => {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    return (
      <span className={isNegative ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}>
        {isNegative ? "-" : "+"}${absAmount.toFixed(2)}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="space-y-3">
      {transactions.map((t) => (
        <div key={t.transaction_id} className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium">
                {(t.merchant_name ?? t.name ?? "?")[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {t.merchant_name ?? t.name ?? "Transaction"}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatDate(t.date)} • {t.category ?? "Uncategorized"}
                {t.pending && " • Pending"}
              </p>
            </div>
          </div>
          <div className="text-sm font-medium pl-2">
            {formatAmount(t.amount)}
          </div>
        </div>
      ))}
      
      <Link 
        href="/transactions" 
        className="block text-center py-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        View all transactions →
      </Link>
    </div>
  );
}