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
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💸</div>
        <p className="font-['Rubik_Mono_One'] text-sm text-gray-600 dark:text-gray-400">No transactions yet</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Connect a bank to start</p>
      </div>
    );
  }

  const formatAmount = (amount: number) => {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    return (
      <span className={`font-['Bungee'] ${isNegative ? "text-red-500" : "text-green-500"}`}>
        {isNegative ? "-" : "+"}${absAmount.toFixed(0)}
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

  const getCategoryEmoji = (category: string | null) => {
    const categoryMap: { [key: string]: string } = {
      "Food and Drink": "🍔",
      "Travel": "✈️",
      "Shops": "🛍️",
      "Transfer": "💸",
      "Payment": "💳",
      "Recreation": "🎮",
      "Service": "🔧",
      "Transportation": "🚗",
      "Healthcare": "🏥",
      "Bank Fees": "🏦"
    };
    return categoryMap[category ?? ""] || "💰";
  };

  return (
    <div className="space-y-2">
      {transactions.map((t) => (
        <div 
          key={t.transaction_id} 
          className="group relative bg-white/50 dark:bg-gray-900/50 rounded-xl p-3 border-2 border-cyan-200 dark:border-cyan-800 hover:border-cyan-400 dark:hover:border-cyan-600 hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-400 dark:from-cyan-600 dark:to-teal-600 flex items-center justify-center text-white shadow-md">
                  <span className="text-lg">{getCategoryEmoji(t.category)}</span>
                </div>
                {t.pending && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-['Rubik_Mono_One'] text-sm text-gray-900 dark:text-gray-100 truncate">
                  {t.merchant_name ?? t.name ?? "Transaction"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {formatDate(t.date)} • {t.category ?? "Other"}
                  {t.pending && <span className="ml-1 text-yellow-600 dark:text-yellow-400">• Pending</span>}
                </p>
              </div>
            </div>
            <div className="text-sm font-medium pl-2">
              {formatAmount(t.amount)}
            </div>
          </div>
        </div>
      ))}
      
      <Link 
        href="/transactions" 
        className="block text-center py-3 mt-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl font-['Rubik_Mono_One'] text-sm hover:scale-105 transition-all shadow-lg hover:shadow-cyan-500/50"
      >
        VIEW ALL →
      </Link>
    </div>
  );
}