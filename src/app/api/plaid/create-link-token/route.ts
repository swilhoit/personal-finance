import { NextResponse } from "next/server";
import { getPlaidClient } from "@/lib/plaid";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Products, CountryCode } from "plaid";

export async function POST() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plaid = getPlaidClient();
  const resp = await plaid.linkTokenCreate({
    user: { client_user_id: user.id },
    client_name: "Personal Finance",
    language: "en",
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
  });

  return NextResponse.json({ link_token: resp.data.link_token });
}
