import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import InvestmentsClient from "./InvestmentsClient";

export const metadata = {
  title: "Investments | Finance AI",
  description: "Manage your investment portfolio",
};

export default async function InvestmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  // Fetch user's holdings
  const { data: holdings } = await supabase
    .from("user_holdings")
    .select("*")
    .eq("user_id", user.id)
    .order("symbol");

  // Get unique symbols from holdings
  const symbols = [...new Set(holdings?.map((h) => h.symbol) || [])];

  // Fetch current prices for holdings
  let marketData: Record<string, any> = {};
  if (symbols.length > 0) {
    const { data: prices } = await supabase
      .from("market_data")
      .select("*")
      .in("symbol", symbols)
      .order("date", { ascending: false });

    prices?.forEach((p) => {
      if (!marketData[p.symbol]) {
        marketData[p.symbol] = p;
      }
    });
  }

  // Fetch recent weekly analyses
  const { data: analyses } = await supabase
    .from("weekly_analysis")
    .select("*")
    .eq("user_id", user.id)
    .order("week_start", { ascending: false })
    .limit(5);

  // Fetch portfolio categories for reference
  const { data: categories } = await supabase
    .from("portfolio_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  return (
    <InvestmentsClient
      holdings={holdings || []}
      marketData={marketData}
      analyses={analyses || []}
      categories={categories || []}
    />
  );
}
