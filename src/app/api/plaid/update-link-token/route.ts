import { NextRequest, NextResponse } from "next/server";
import { getPlaidClient } from "@/lib/plaid";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CountryCode } from "plaid";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const item_id = searchParams.get("item_id");
  if (!item_id) return NextResponse.json({ error: "Missing item_id" }, { status: 400 });

  const { data: item } = await supabase
    .from("plaid_items")
    .select("access_token")
    .eq("user_id", user.id)
    .eq("item_id", item_id)
    .single();
  if (!item?.access_token) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const plaid = getPlaidClient();
  const resp = await plaid.linkTokenCreate({
    user: { client_user_id: user.id },
    client_name: "Personal Finance",
    language: "en",
    access_token: item.access_token,
    country_codes: [CountryCode.Us],
  });

  return NextResponse.json({ link_token: resp.data.link_token });
}
