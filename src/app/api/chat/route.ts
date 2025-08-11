import { z } from "zod";
import { streamText } from "ai";
import { tool } from "@ai-sdk/provider-utils";
import { openai } from "@ai-sdk/openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const maxDuration = 30;

type RecentTransactionRow = {
  date: string;
  name: string | null;
  merchant_name: string | null;
  amount: number;
  iso_currency_code: string | null;
  category: string | null;
};

type SpendingRow = {
  category: string | null;
  amount: number;
  date: string;
};

type AccountBalanceRow = {
  name: string | null;
  official_name: string | null;
  current_balance: number | null;
  available_balance: number | null;
  iso_currency_code: string | null;
};

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const getRecentTransactions = tool<{ limit?: number }, RecentTransactionRow[]>({
    description: "Get the user's most recent transactions",
    inputSchema: z.object({ limit: z.number().min(1).max(100) }).partial(),
    execute: async ({ limit = 20 }) => {
      const { data, error } = await supabase
        .from("transactions")
        .select("date, name, merchant_name, amount, iso_currency_code, category")
        .order("date", { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data as RecentTransactionRow[]) ?? [];
    },
  });

  const getSpendingByCategory = tool<{ days?: number }, { category: string; total: number }[]>({
    description: "Aggregate total spending by category over a recent time window",
    inputSchema: z.object({ days: z.number().min(1).max(365) }).partial(),
    execute: async ({ days = 30 }) => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data, error } = await supabase
        .from("transactions")
        .select("category, amount, date")
        .gte("date", since.toISOString().slice(0, 10));
      if (error) throw new Error(error.message);
      const totals = new Map<string, number>();
      for (const t of (data as SpendingRow[]) ?? []) {
        const key = t.category ?? "Uncategorized";
        totals.set(key, (totals.get(key) ?? 0) + Number(t.amount));
      }
      return Array.from(totals.entries()).map(([category, total]) => ({ category, total }));
    },
  });

  const getAccountBalances = tool<Record<string, never>, AccountBalanceRow[]>({
    description: "List current balances by account",
    inputSchema: z.object({}),
    execute: async () => {
      const { data, error } = await supabase
        .from("plaid_accounts")
        .select("name, official_name, current_balance, available_balance, iso_currency_code");
      if (error) throw new Error(error.message);
      return (data as AccountBalanceRow[]) ?? [];
    },
  });

  const body = await req.json();

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    messages: body.messages ?? [],
    system: `You are a helpful personal finance analyst. Use the available tools to fetch the user's data as needed. Be concise and include simple bullet points and totals where helpful. If data is missing, say what to do next (like connect an account or sync).`,
    tools: { getRecentTransactions, getSpendingByCategory, getAccountBalances },
  });

  return result.toTextStreamResponse();
}
