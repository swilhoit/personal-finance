import { NextRequest, NextResponse } from "next/server";
import { getPlaidClient } from "@/lib/plaid";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { public_token } = await req.json();
  if (!public_token) return NextResponse.json({ error: "Missing public_token" }, { status: 400 });

  const plaid = getPlaidClient();
  const exchange = await plaid.itemPublicTokenExchange({ public_token });
  const access_token = exchange.data.access_token;
  const item_id = exchange.data.item_id;

  await admin.from("plaid_items").upsert({
    user_id: user.id,
    item_id,
    access_token,
  }, { onConflict: "item_id" });

  const accountsResp = await plaid.accountsGet({ access_token });
  const accounts = accountsResp.data.accounts.map((a) => ({
    user_id: user.id,
    item_id,
    account_id: a.account_id,
    name: a.name ?? null,
    official_name: a.official_name ?? null,
    mask: a.mask ?? null,
    type: a.type ?? null,
    subtype: (a.subtype as string) ?? null,
    current_balance: a.balances.current ?? null,
    available_balance: a.balances.available ?? null,
    iso_currency_code: a.balances.iso_currency_code ?? null,
  }));
  if (accounts.length > 0) {
    await admin.from("plaid_accounts").upsert(accounts, { onConflict: "account_id" });
  }

  return NextResponse.json({ ok: true, item_id });
}
