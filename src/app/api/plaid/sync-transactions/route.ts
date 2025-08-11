import { NextResponse } from "next/server";
import { getPlaidClient } from "@/lib/plaid";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { subDays, format } from "date-fns";

export async function POST() {
  const supabase = createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: items, error } = await admin
    .from("plaid_items")
    .select("item_id, access_token")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const plaid = getPlaidClient();
  const start_date = format(subDays(new Date(), 30), "yyyy-MM-dd");
  const end_date = format(new Date(), "yyyy-MM-dd");

  let inserted = 0;

  for (const item of items ?? []) {
    const resp = await plaid.transactionsGet({
      access_token: item.access_token,
      start_date,
      end_date,
      options: { include_personal_finance_category: true },
    });

    const txs = resp.data.transactions.map((t) => ({
      user_id: user.id,
      account_id: t.account_id,
      transaction_id: t.transaction_id,
      name: t.name ?? null,
      merchant_name: t.merchant_name ?? null,
      amount: t.amount,
      iso_currency_code: t.iso_currency_code ?? null,
      category: (t.personal_finance_category?.primary ?? t.category?.[0]) ?? null,
      date: t.date,
      pending: t.pending ?? false,
    }));

    if (txs.length > 0) {
      await admin
        .from("transactions")
        .upsert(txs, { onConflict: "transaction_id" });
      inserted += txs.length;
    }
  }

  return NextResponse.json({ ok: true, inserted });
}
