import { createSupabaseServerClient } from "@/lib/supabase/server";
import AutoSubmitSelect from "@/components/AutoSubmitSelect";
import { setTransactionCategory } from "./actions";

export default async function TransactionsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-6">Please sign in.</div>;

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

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Transactions</h1>
      <div className="space-y-2">
        {(txs ?? []).map((t) => (
          <div key={t.transaction_id} className="border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-center">
            <div>
              <div className="font-medium">{t.name ?? t.merchant_name ?? "Transaction"}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">{t.date}</div>
            </div>
            <div className="flex items-center gap-3 justify-between sm:justify-end">
              <div className="text-sm">
                <AutoSubmitSelect
                  formAction={setTransactionCategory}
                  name="category_id"
                  defaultValue={t.category_id ?? ""}
                  hiddenFields={{ transaction_id: t.transaction_id }}
                >
                  <option value="">Uncategorized</option>
                  {(categories ?? []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </AutoSubmitSelect>
              </div>
              <div className="font-semibold text-right min-w-[90px]">{t.amount} {t.iso_currency_code ?? "USD"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
