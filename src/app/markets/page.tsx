import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MarketsClient from "./MarketsClient";

interface MarketDataPoint {
  symbol: string;
  name: string;
  price: number;
  change_amount: number;
  change_percent: number;
  volume: number;
  market_cap: number;
  performance_30d: number | null;
  performance_90d: number | null;
  performance_365d: number | null;
}

export const metadata = {
  title: "Markets | Finance AI",
  description: "Track stocks and manage your watchlist",
};

export default async function MarketsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  // Fetch user's watchlist
  const { data: watchlist } = await supabase
    .from("user_watchlists")
    .select("*")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  // Fetch portfolio categories
  const { data: categories } = await supabase
    .from("portfolio_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  // Fetch latest market data for watchlist symbols
  const symbols = watchlist?.map((w) => w.symbol) || [];
  const marketData: Record<string, MarketDataPoint> = {};

  if (symbols.length > 0) {
    const { data: prices } = await supabase
      .from("market_data")
      .select("*")
      .in("symbol", symbols)
      .order("date", { ascending: false });

    // Group by symbol, take latest
    prices?.forEach((p) => {
      if (!marketData[p.symbol]) {
        marketData[p.symbol] = p;
      }
    });
  }

  // Fetch recent market news
  const { data: news } = await supabase
    .from("market_news")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(10);

  return (
    <MarketsClient
      watchlist={watchlist || []}
      categories={categories || []}
      marketData={marketData}
      news={news || []}
    />
  );
}
