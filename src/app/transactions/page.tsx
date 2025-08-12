import { createSupabaseServerClient } from "@/lib/supabase/server";
import AutoSubmitSelect from "@/components/AutoSubmitSelect";
import { setTransactionCategory } from "./actions";
import { redirect } from "next/navigation";

export default async function TransactionsPage() {
  const supabase = await createSupabaseServerClient(true);
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/sign-in");
  }

  const [{ data: txs }, { data: categories }] = await Promise.all([
    supabase
      .from("transactions")
      .select("date, name, merchant_name, amount, iso_currency_code, category, transaction_id, category_id")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(200),
    supabase
      .from("categories")
      .select("id, name, type")
      .eq("user_id", user.id)
      .order("name"),
  ]);

  const groupedTransactions = (txs ?? []).reduce((acc, tx) => {
    const date = new Date(tx.date);
    const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(tx);
    return acc;
  }, {} as Record<string, typeof txs>);

  const totalSpent = (txs ?? []).reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0);
  const totalIncome = (txs ?? []).reduce((sum, t) => sum + (t.amount < 0 ? Math.abs(t.amount) : 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-[#f5f0e8] dark:bg-zinc-900 border-b border-[#e8dfd2] dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Transactions</h1>
              <p className="text-sm text-[#7d6754] dark:text-zinc-400 mt-1">
                View and categorize your recent transactions
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-xs text-[#9b826f] dark:text-zinc-400">Total Spent</p>
                <p className="text-lg font-semibold text-[#c17767] dark:text-red-400">
                  ${totalSpent.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#9b826f] dark:text-zinc-400">Total Income</p>
                <p className="text-lg font-semibold text-[#87a878] dark:text-green-400">
                  ${totalIncome.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {(!txs || txs.length === 0) ? (
          <div className="bg-[#f5f0e8] dark:bg-zinc-900 rounded-xl border border-[#e8dfd2] dark:border-zinc-800 p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-[#d4c4b0] dark:text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h2 className="text-xl font-semibold mb-2">No transactions yet</h2>
            <p className="text-[#7d6754] dark:text-zinc-400 mb-6 max-w-sm mx-auto">
              Connect your bank account to start seeing your transactions here.
            </p>
            <a href="/dashboard" className="inline-flex items-center px-4 py-2 bg-[#3d3028] text-[#faf8f5] dark:bg-white dark:text-black rounded-lg hover:opacity-90 transition-opacity">
              Go to Dashboard
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([monthYear, transactions]) => (
              <div key={monthYear}>
                <h2 className="text-sm font-semibold text-[#7d6754] dark:text-zinc-400 mb-3 sticky top-0 bg-[#faf8f5] dark:bg-black py-2">
                  {monthYear}
                </h2>
                <div className="bg-[#f5f0e8] dark:bg-zinc-900 rounded-xl border border-[#e8dfd2] dark:border-zinc-800 overflow-hidden">
                  <div className="divide-y divide-[#e8dfd2] dark:divide-zinc-800">
                    {transactions?.map((t) => (
                      <div key={t.transaction_id} className="p-4 hover:bg-[#faf8f5] dark:hover:bg-zinc-800/50 transition-colors">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.amount > 0 ? 'bg-[#c17767]' : 'bg-[#87a878]'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {t.merchant_name || t.name || "Transaction"}
                                </p>
                                <p className="text-xs text-[#9b826f] dark:text-zinc-400">
                                  {new Date(t.date).toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <AutoSubmitSelect
                              formAction={setTransactionCategory}
                              name="category_id"
                              defaultValue={t.category_id ?? ""}
                              hiddenFields={{ transaction_id: t.transaction_id }}
                              className="text-sm px-3 py-1 border border-[#d4c4b0] dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7a95a7] dark:bg-zinc-800 bg-[#faf8f5]"
                            >
                              <option value="">Uncategorized</option>
                              {(categories ?? []).map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </AutoSubmitSelect>
                            
                            <div className={`font-semibold text-right min-w-[100px] ${t.amount > 0 ? 'text-[#c17767] dark:text-red-400' : 'text-[#87a878] dark:text-green-400'}`}>
                              {t.amount > 0 ? '-' : '+'} ${Math.abs(t.amount).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}