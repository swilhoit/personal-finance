import { NextResponse } from "next/server";
import { getPlaidClient } from "@/lib/plaid";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { subDays, format } from "date-fns";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: items, error } = await admin
    .from("plaid_items")
    .select("item_id, access_token, transactions_cursor")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const runStart = new Date().toISOString();
  let runId: string | null = null;
  try {
    const insertRun = await admin
      .from("sync_runs")
      .insert({ user_id: user.id, item_id: items?.[0]?.item_id ?? null, status: "partial", started_at: runStart, note: "sync start" })
      .select("id")
      .single();
    runId = insertRun.data?.id ?? null;
  } catch {}

  const plaid = getPlaidClient();
  let totalUpserted = 0;

  try {
    for (const item of items ?? []) {
      if (item.transactions_cursor) {
        let cursor = item.transactions_cursor as string;
        let hasMore = true;
        while (hasMore) {
          const resp = await plaid.transactionsSync({ access_token: item.access_token, cursor });
          const added = resp.data.added ?? [];
          const modified = resp.data.modified ?? [];
          const removed = resp.data.removed ?? [];
          cursor = resp.data.next_cursor ?? cursor;
          hasMore = resp.data.has_more ?? false;

          const upserts = [...added, ...modified].map((t) => ({
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
          if (upserts.length > 0) {
            await admin.from("transactions").upsert(upserts, { onConflict: "transaction_id" });
            totalUpserted += upserts.length;
          }
          if (removed.length > 0) {
            const ids = removed.map((r) => r.transaction_id);
            await admin.from("transactions").delete().in("transaction_id", ids);
          }
        }
        await admin.from("plaid_items").update({ transactions_cursor: cursor }).eq("item_id", item.item_id);
      } else {
        const start_date = format(subDays(new Date(), 90), "yyyy-MM-dd");
        const end_date = format(new Date(), "yyyy-MM-dd");
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
          await admin.from("transactions").upsert(txs, { onConflict: "transaction_id" });
          totalUpserted += txs.length;
        }
        const syncInit = await plaid.transactionsSync({ access_token: item.access_token });
        await admin.from("plaid_items").update({ transactions_cursor: syncInit.data.next_cursor }).eq("item_id", item.item_id);
      }
    }

    if (runId) {
      await admin
        .from("sync_runs")
        .update({ status: "success", finished_at: new Date().toISOString(), note: `upserted:${totalUpserted}` })
        .eq("id", runId);
    }

    return NextResponse.json({ ok: true, upserted: totalUpserted });
  } catch (e: unknown) {
    if (runId) {
      await admin
        .from("sync_runs")
        .update({ status: "error", finished_at: new Date().toISOString(), note: String(e) })
        .eq("id", runId);
    }
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
