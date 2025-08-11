import { NextRequest, NextResponse } from "next/server";
import { getPlaidClient } from "@/lib/plaid";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type WebhookBody = { item_id?: string };

type ItemRow = {
  item_id: string;
  access_token: string;
  user_id: string;
  transactions_cursor: string | null;
};

export async function POST(req: NextRequest) {
  const admin = createSupabaseAdminClient();
  const body = (await req.json().catch(() => ({}))) as WebhookBody;

  const item_id = body.item_id;
  if (!item_id) return NextResponse.json({ ok: true });

  const { data: items } = await admin
    .from("plaid_items")
    .select("item_id, access_token, user_id, transactions_cursor")
    .eq("item_id", item_id)
    .limit(1);

  const item = (items?.[0] as ItemRow) || null;
  if (!item) return NextResponse.json({ ok: true });

  const plaid = getPlaidClient();
  let cursor: string | null = item.transactions_cursor ?? null;
  let hasMore = true;
  let total = 0;

  if (cursor) {
    while (hasMore) {
      const resp = await plaid.transactionsSync({ access_token: item.access_token, cursor });
      const added = resp.data.added ?? [];
      const modified = resp.data.modified ?? [];
      const removed = resp.data.removed ?? [];
      cursor = resp.data.next_cursor ?? cursor;
      hasMore = resp.data.has_more ?? false;

      const upserts = [...added, ...modified].map((t) => ({
        user_id: item.user_id,
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
        total += upserts.length;
      }
      if (removed.length > 0) {
        const ids = removed.map((r) => r.transaction_id);
        await admin.from("transactions").delete().in("transaction_id", ids);
      }
    }
    await admin.from("plaid_items").update({ transactions_cursor: cursor }).eq("item_id", item_id);
  }

  return NextResponse.json({ ok: true, upserted: total });
}
