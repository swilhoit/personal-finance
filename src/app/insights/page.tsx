import { createSupabaseServerClient } from "@/lib/supabase/server";
import MiniBar from "@/components/MiniBar";

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

  const chartData = rows.map((r) => ({ label: r.category_name ?? "Uncategorized", value: Number(r.total_amount || 0) }));

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Insights</h1>
      <div className="border rounded-xl p-4 space-y-3">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">Month-to-date</div>
        <div className="text-2xl font-bold">${total.toFixed(2)}</div>
        <MiniBar data={chartData} />
      </div>
    </div>
  );
}
