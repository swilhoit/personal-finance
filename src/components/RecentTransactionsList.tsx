import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function RecentTransactionsList() {
  const supabase = await createSupabaseServerClient(true);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: transactions } = await supabase
    .from("transactions")
    .select(`
      transaction_id, date, name, merchant_name, amount, category, pending, account_id,
      teller_accounts!account_id (type)
    `)
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(5);

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm text-gray-600">No transactions yet</p>
        <p className="text-xs text-gray-500 mt-1">Connect a bank account to start tracking</p>
      </div>
    );
  }

  const formatAmount = (amount: number, accountType: string) => {
    const isExpense = amount < 0;
    const isIncome = amount > 0 && accountType === 'depository';
    const isCreditPayment = amount > 0 && accountType === 'credit';
    const absAmount = Math.abs(amount);

    if (isCreditPayment) {
      return (
        <span className="font-medium text-blue-600">
          ${absAmount.toFixed(2)}
          <span className="block text-xs text-blue-500">Payment</span>
        </span>
      );
    }

    return (
      <span className={`font-medium ${isExpense ? "text-red-600" : "text-green-600"}`}>
        {isExpense ? "−" : "+"}${absAmount.toFixed(2)}
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

  const getCategoryInitial = (category: string | null, accountType: string, amount: number) => {
    // Credit card payment
    if (amount > 0 && accountType === 'credit') return "💳";
    if (!category) return "T";
    return category.charAt(0).toUpperCase();
  };

  return (
    <div className="space-y-2">
      {transactions.map((t) => {
        const tellerAccount = t.teller_accounts as unknown as { type: string } | null;
        const accountType = tellerAccount?.type || 'depository';
        const isCreditPayment = t.amount > 0 && accountType === 'credit';

        return (
          <div
            key={t.transaction_id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium flex-shrink-0 ${
                isCreditPayment ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
              }`}>
                {getCategoryInitial(t.category, accountType, t.amount)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">
                  {t.merchant_name || t.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(t.date)}
                  {t.pending && (
                    <span className="ml-2 text-gray-400">• Pending</span>
                  )}
                  {t.category && !isCreditPayment && (
                    <span className="ml-2 text-gray-400">• {t.category}</span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right ml-4 flex-shrink-0">
              {formatAmount(t.amount, accountType)}
            </div>
          </div>
        );
      })}
      <Link
        href="/transactions"
        className="block text-center py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        View all transactions →
      </Link>
    </div>
  );
}
