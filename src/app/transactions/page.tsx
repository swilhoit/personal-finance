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

  // Negative amounts = expenses (money out), Positive amounts = income (money in)
  const totalSpent = (txs ?? []).reduce((sum, t) => sum + (t.amount < 0 ? Math.abs(t.amount) : 0), 0);
  const totalIncome = (txs ?? []).reduce((sum, t) => sum + (t.amount > 0 ? t.amount : 0), 0);
  const netFlow = totalIncome - totalSpent;

  // Get transaction stats
  const transactionCount = txs?.length || 0;
  const avgTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-dm-mono font-black flex items-center gap-3">
                <span className="text-5xl">💸</span>
                TRANSACTION LOG
              </h1>
              <p className="text-white/90 mt-2 font-dm-mono text-sm">
                {transactionCount} TRANSACTIONS • LAST 200 SHOWN
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                <p className="text-xs font-dm-mono text-white/80">SPENT</p>
                <p className="text-2xl font-dm-mono font-black text-white flex items-center gap-1">
                  <span className="text-red-300">📉</span>
                  ${totalSpent.toFixed(0)}
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                <p className="text-xs font-dm-mono text-white/80">EARNED</p>
                <p className="text-2xl font-dm-mono font-black text-white flex items-center gap-1">
                  <span className="text-green-300">📈</span>
                  ${totalIncome.toFixed(0)}
                </p>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                <p className="text-xs font-dm-mono text-white/80">NET</p>
                <p className={`text-2xl font-dm-mono font-black flex items-center gap-1 ${netFlow >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  <span>{netFlow >= 0 ? '✅' : '⚠️'}</span>
                  ${Math.abs(netFlow).toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg border-2 border-cyan-400 p-4 text-center">
            <p className="text-2xl mb-1">🎯</p>
            <p className="font-dm-mono font-black text-lg text-cyan-600 text-cyan-400">${avgTransaction.toFixed(0)}</p>
            <p className="text-xs font-dm-mono text-gray-500">AVG SPEND</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg border-2 border-sky-400 border-sky-600 p-4 text-center">
            <p className="text-2xl mb-1">📊</p>
            <p className="font-dm-mono font-black text-lg text-sky-600 text-sky-400">{Object.keys(groupedTransactions).length}</p>
            <p className="text-xs font-dm-mono text-gray-500">MONTHS</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg border-2 border-teal-400 border-teal-600 p-4 text-center">
            <p className="text-2xl mb-1">🏷️</p>
            <p className="font-dm-mono font-black text-lg text-teal-600 text-teal-400">{categories?.length || 0}</p>
            <p className="text-xs font-dm-mono text-gray-500">CATEGORIES</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg border-2 border-purple-400 border-purple-600 p-4 text-center">
            <p className="text-2xl mb-1">💳</p>
            <p className="font-dm-mono font-black text-lg text-purple-600 text-purple-400">{transactionCount}</p>
            <p className="text-xs font-dm-mono text-gray-500">TOTAL TXN</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(!txs || txs.length === 0) ? (
          <div className="bg-white rounded-3xl shadow-2xl border-4 border-cyan-400 p-12 text-center">
            <div className="text-8xl mb-6 animate-bounce">💳</div>
            <h2 className="text-3xl font-dm-mono font-black mb-3 bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
              NO TRANSACTIONS YET!
            </h2>
            <p className="text-gray-600 text-gray-400 mb-8 max-w-md mx-auto font-dm-mono">
              Connect your bank account to start tracking transactions! 🚀
            </p>
            <a href="/accounts" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-2xl hover:scale-105 transition-all font-dm-mono shadow-lg hover:shadow-cyan-500/50">
              <span className="text-xl">🔗</span>
              CONNECT ACCOUNT
            </a>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTransactions).map(([monthYear, transactions]) => (
              <div key={monthYear}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-xl font-dm-mono font-black text-cyan-600 text-cyan-400">
                    📅 {monthYear.toUpperCase()}
                  </h2>
                  <div className="flex-1 h-1 bg-gradient-to-r from-cyan-400 to-transparent rounded-full"></div>
                  <span className="font-dm-mono text-sm text-gray-500">
                    {transactions?.length} ITEMS
                  </span>
                </div>
                
                <div className="bg-white rounded-2xl border-4 border-cyan-400 overflow-hidden shadow-xl">
                  <div className="divide-y-2 divide-cyan-100 divide-cyan-900/30">
                    {transactions?.map((t) => {
                      const isExpense = t.amount < 0;
                      const absAmount = Math.abs(t.amount);
                      const emoji = isExpense ?
                        (absAmount > 100 ? '💸' : absAmount > 50 ? '💰' : '💵') :
                        '💚';
                      
                      return (
                        <div key={t.transaction_id} className="p-4 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-teal-50 hover:from-cyan-900/20 hover:to-teal-900/20 transition-all group">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <div className="text-2xl group-hover:animate-bounce">
                                  {emoji}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-dm-mono text-sm truncate text-gray-900">
                                    {t.merchant_name || t.name || "Unknown Quest"}
                                  </p>
                                  <p className="text-xs text-gray-700 flex items-center gap-2">
                                    <span>🗓️</span>
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
                                className="text-sm px-3 py-2 border-2 border-cyan-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-cyan-400 bg-white font-dm-mono text-cyan-700"
                              >
                                <option value="">🏷️ UNCATEGORIZED</option>
                                {(categories ?? []).map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.type === 'income' ? '💰' : '📦'} {c.name.toUpperCase()}
                                  </option>
                                ))}
                              </AutoSubmitSelect>
                              
                              <div className={`font-dm-mono font-black text-xl min-w-[120px] text-right flex items-center gap-2 ${
                                isExpense ? 'text-red-500' : 'text-green-500'
                              }`}>
                                <span className="text-sm">{isExpense ? '−' : '+'}</span>
                                <span>${Math.abs(t.amount).toFixed(0)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {txs && txs.length >= 200 && (
              <div className="text-center py-8">
                <button className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-2xl font-dm-mono hover:scale-105 transition-all shadow-lg hover:shadow-cyan-500/50">
                  LOAD MORE TRANSACTIONS 🔄
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}