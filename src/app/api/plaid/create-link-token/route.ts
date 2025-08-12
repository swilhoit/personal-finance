import { NextResponse } from "next/server";
import { getPlaidClient } from "@/lib/plaid";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Products, CountryCode } from "plaid";

export async function POST() {
  try {
    // Check for required environment variables
    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
      console.error("Missing Plaid credentials");
      return NextResponse.json(
        { error: "Plaid integration not configured. Please add PLAID_CLIENT_ID and PLAID_SECRET to your environment variables." },
        { status: 503 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const plaid = getPlaidClient();
    const webhook = process.env.PLAID_WEBHOOK_URL; // optional, for incremental updates
    
    const resp = await plaid.linkTokenCreate({
      user: { client_user_id: user.id },
      client_name: "Personal Finance",
      language: "en",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      webhook: webhook ?? undefined,
      account_filters: undefined,
    });

    return NextResponse.json({ link_token: resp.data.link_token });
  } catch (error) {
    console.error("Error creating Plaid link token:", error);
    return NextResponse.json(
      { error: "Failed to create Plaid link token. Please check your Plaid configuration." },
      { status: 500 }
    );
  }
}
