import { createSupabaseServerClient } from "@/lib/supabase/server";

type MonthSpendRow = {
  category_name: string | null;
  total_amount: number;
  txn_count: number;
};

export default async function InsightsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-6">Please sign in.</div>;

  const { data: monthByCat } = await supabase
    .from("v_month_spend_by_category")
    .select("category_name, total_amount, txn_count");

  const rows: MonthSpendRow[] = (monthByCat as MonthSpendRow[]) ?? [];
  const total = rows.reduce((sum, x) => sum + Number(x.total_amount || 0), 0);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Insights</h1>
      <div className="border rounded-xl p-4">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">Month-to-date</div>
        <div className="text-2xl font-bold">${total.toFixed(2)}</div>
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={(r.category_name ?? "uncategorized") as string} className="border rounded-lg p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{r.category_name ?? "Uncategorized"}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400">{r.txn_count} txns</div>
            </div>
            <div className="font-semibold">{Number(r.total_amount || 0).toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
