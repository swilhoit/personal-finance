import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type MonthCatRow = { category_name: string | null; total_amount: number | null; txn_count: number | null };
type Txn = { merchant_name: string | null; amount: number; date: string };

export async function POST() {
  const admin = createSupabaseAdminClient();

  const { data: users } = await admin.from("profiles").select("user_id");
  if (!users) return NextResponse.json({ ok: true });

  for (const u of users) {
    const { data: rows } = await admin
      .from("v_month_spend_by_category")
      .select("category_name, total_amount, txn_count")
      .eq("user_id", u.user_id);

    await admin
      .from("insight_cache")
      .upsert({
        user_id: u.user_id,
        cache_key: "month_spend_by_category",
        value: (rows as MonthCatRow[]) ?? [],
      }, { onConflict: "user_id,cache_key" });

    const { data: recent } = await admin
      .from("transactions")
      .select("merchant_name, amount, date")
      .eq("user_id", u.user_id)
      .gte("date", new Date(Date.now() - 1000*60*60*24*90).toISOString().slice(0,10));

    const groups = new Map<string, { count: number; total: number; last: string }>();
    for (const t of (recent as Txn[]) ?? []) {
      const m = t.merchant_name;
      if (!m) continue;
      const g = groups.get(m) ?? { count: 0, total: 0, last: "" };
      g.count += 1;
      g.total += Number(t.amount);
      g.last = t.date;
      groups.set(m, g);
    }
    const recurring = Array.from(groups.entries())
      .filter(([, g]) => g.count >= 3)
      .map(([merchant_name, g]) => ({
        merchant_name,
        avg_amount: g.total / g.count,
        last_seen: g.last,
      }));

    for (const r of recurring) {
      await admin.from("recurring_merchants").upsert({
        user_id: u.user_id,
        merchant_name: r.merchant_name,
        avg_amount: r.avg_amount,
        last_seen: r.last_seen,
      }, { onConflict: "user_id,merchant_name" });
    }
  }

  return NextResponse.json({ ok: true });
}
