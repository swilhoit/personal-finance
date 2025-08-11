import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function TransactionsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-6">Please sign in.</div>;

  const { data: txs } = await supabase
    .from("transactions")
    .select("date, name, merchant_name, amount, iso_currency_code, category")
    .order("date", { ascending: false })
    .limit(200);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Transactions</h1>
      <div className="space-y-2">
        {(txs ?? []).map((t) => (
          <div key={t.date + (t.name ?? "") + (t.merchant_name ?? "")} className="border rounded-lg p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{t.name ?? t.merchant_name ?? "Transaction"}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">{t.category ?? "Uncategorized"} · {t.date}</div>
            </div>
            <div className="font-semibold">{t.amount} {t.iso_currency_code ?? "USD"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
