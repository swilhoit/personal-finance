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

type BudgetRow = { category_id: string; month: string; amount: number; categories?: { name?: string } | null };

type BudgetStatus = {
  category_id: string;
  category_name: string;
  month: string;
  budget_amount: number;
  spent_amount: number;
  remaining_amount: number;
};

type RecurringRow = {
  merchant_name: string;
  avg_amount: number | null;
  last_seen: string | null;
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
        .eq("user_id", user.id)
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
        .eq("user_id", user.id)
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
        .select("name, official_name, current_balance, available_balance, iso_currency_code")
        .eq("user_id", user.id)
        .limit(100);
      if (error) throw new Error(error.message);
      return (data as AccountBalanceRow[]) ?? [];
    },
  });

  const getBudgetStatus = tool<Record<string, never>, BudgetStatus[]>({
    description: "Get current month's budgets with spent and remaining amounts",
    inputSchema: z.object({}),
    execute: async () => {
      const start = new Date();
      start.setDate(1);
      const startStr = start.toISOString().slice(0, 10);
      const next = new Date(start);
      next.setMonth(next.getMonth() + 1);
      const nextStr = next.toISOString().slice(0, 10);

      const [{ data: budgets }, { data: agg }] = await Promise.all([
        supabase
          .from("budgets")
          .select("category_id, month, amount, categories(name)")
          .eq("user_id", user.id)
          .gte("month", startStr)
          .lte("month", startStr),
        supabase
          .from("transactions")
          .select("amount, category_id")
          .eq("user_id", user.id)
          .gte("date", startStr)
          .lt("date", nextStr),
      ]);

      const spentByCat = new Map<string, number>();
      for (const t of (agg as { amount: number; category_id: string | null }[]) ?? []) {
        if (!t.category_id) continue;
        spentByCat.set(t.category_id, (spentByCat.get(t.category_id) ?? 0) + Number(t.amount));
      }

      const out: BudgetStatus[] = [];
      for (const b of (budgets as BudgetRow[]) ?? []) {
        const category_id = b.category_id;
        const budget_amount = Number(b.amount) || 0;
        const spent_amount = spentByCat.get(category_id) ?? 0;
        out.push({
          category_id,
          category_name: b.categories?.name ?? "Category",
          month: startStr,
          budget_amount,
          spent_amount,
          remaining_amount: budget_amount - spent_amount,
        });
      }
      return out;
    },
  });

  const getRecurringMerchants = tool<Record<string, never>, RecurringRow[]>({
    description: "List detected recurring merchants with average amount and last seen date",
    inputSchema: z.object({}),
    execute: async () => {
      const { data, error } = await supabase
        .from("recurring_merchants")
        .select("merchant_name, avg_amount, last_seen")
        .eq("user_id", user.id)
        .order("merchant_name");
      if (error) throw new Error(error.message);
      return (data as RecurringRow[]) ?? [];
    },
  });

  const getCachedInsight = tool<{ key: string }, { key: string; value: unknown; computed_at: string } | null>({
    description: "Fetch a cached insight by key for the user",
    inputSchema: z.object({ key: z.string() }),
    execute: async ({ key }) => {
      const { data, error } = await supabase
        .from("insight_cache")
        .select("value, computed_at")
        .eq("user_id", user.id)
        .eq("cache_key", key)
        .single();
      if (error && error.code !== "PGRST116") throw new Error(error.message);
      if (!data) return null;
      return { key, value: data.value as unknown, computed_at: data.computed_at };
    },
  });

  const body = await req.json();

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    messages: body.messages ?? [],
    system: `You are a helpful personal finance analyst. Use the available tools to fetch the user's data as needed. Be concise and include simple bullet points and totals where helpful. If data is missing, say what to do next (like connect an account or sync).`,
    tools: { getRecentTransactions, getSpendingByCategory, getAccountBalances, getBudgetStatus, getRecurringMerchants, getCachedInsight },
  });

  return result.toTextStreamResponse();
}
