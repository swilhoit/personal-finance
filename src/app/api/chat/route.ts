import { z } from "zod";
import { streamText, convertToModelMessages, UIMessage } from "ai";
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
  institution_name: string | null;
  current_balance: number | null;
  available_balance: number | null;
  currency: string | null;
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

type WatchlistRow = {
  id: string;
  symbol: string;
  added_at: string;
  target_price: number | null;
  alerts_enabled: boolean;
  notes: string | null;
};

type NotificationScheduleRow = {
  id: string;
  schedule_type: string;
  is_enabled: boolean;
  cron_expression: string;
  discord_guild_id: string | null;
};

export async function POST(req: Request) {
  console.log("[Chat API] Request received");
  console.log("[Chat API] Headers:", Object.fromEntries(req.headers.entries()));
  
  try {
    // Check if OpenAI API key is configured
    console.log("[Chat API] Checking OpenAI API key...");
    if (!process.env.OPENAI_API_KEY) {
      console.error("[Chat API] OPENAI_API_KEY is not configured");
      return new Response(
        JSON.stringify({ 
          error: "AI chat is not configured. Please add OPENAI_API_KEY to your environment variables." 
        }), 
        { 
          status: 503,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    console.log("[Chat API] OpenAI API key found");

    console.log("[Chat API] Checking authentication...");
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("[Chat API] User not authenticated");
      return new Response("Unauthorized", { status: 401 });
    }
    console.log("[Chat API] User authenticated:", user.id);
    
  // Get or create session ID for chat history
  const sessionId = req.headers.get("x-session-id") || crypto.randomUUID();
  console.log("[Chat API] Session ID:", sessionId);

  const getRecentTransactions = tool<{ limit?: number }, RecentTransactionRow[]>({
    description: "Get the user's most recent transactions",
    inputSchema: z.object({ limit: z.number().min(1).max(100) }).partial(),
    execute: async ({ limit = 20 }) => {
      try {
        console.log("[Chat API] Tool getRecentTransactions for user", user.id);
        const { data, error } = await supabase
          .from("transactions")
          .select("date, name, merchant_name, amount, iso_currency_code, category")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(limit);
        if (error) {
          console.error("[Chat API] getRecentTransactions error:", error);
          return [];
        }
        return (data as RecentTransactionRow[]) ?? [];
      } catch (e) {
        console.error("[Chat API] getRecentTransactions unexpected error:", e);
        return [];
      }
    },
  });

  const getSpendingByCategory = tool<{ days?: number }, { category: string; total: number }[]>({
    description: "Aggregate total spending by category over a recent time window",
    inputSchema: z.object({ days: z.number().min(1).max(365) }).partial(),
    execute: async ({ days = 30 }) => {
      try {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const { data, error } = await supabase
          .from("transactions")
          .select("category, amount, date")
          .eq("user_id", user.id)
          .gte("date", since.toISOString().slice(0, 10));
        if (error) {
          console.error("[Chat API] getSpendingByCategory error:", error);
          return [];
        }
        const totals = new Map<string, number>();
        for (const t of (data as SpendingRow[]) ?? []) {
          const key = t.category ?? "Uncategorized";
          totals.set(key, (totals.get(key) ?? 0) + Number(t.amount));
        }
        return Array.from(totals.entries()).map(([category, total]) => ({ category, total }));
      } catch (e) {
        console.error("[Chat API] getSpendingByCategory unexpected error:", e);
        return [];
      }
    },
  });

  const getAccountBalances = tool<Record<string, never>, AccountBalanceRow[]>({
    description: "List current balances by account",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const { data, error } = await supabase
          .from("teller_accounts")
          .select("name, institution_name, current_balance, available_balance, currency")
          .eq("user_id", user.id)
          .limit(100);
        if (error) {
          console.error("[Chat API] getAccountBalances error:", error);
          return [];
        }
        return (data as AccountBalanceRow[]) ?? [];
      } catch (e) {
        console.error("[Chat API] getAccountBalances unexpected error:", e);
        return [];
      }
    },
  });

  const getBudgetStatus = tool<Record<string, never>, BudgetStatus[]>({
    description: "Get current month's budgets with spent and remaining amounts",
    inputSchema: z.object({}),
    execute: async () => {
      const start = new Date();
      start.setDate(1);
      const startStr = start.toISOString().slice(0, 10); // YYYY-MM-DD (first day)
      const monthKey = start.toISOString().slice(0, 7);  // YYYY-MM (matches budgets.month)
      const next = new Date(start);
      next.setMonth(next.getMonth() + 1);
      const nextStr = next.toISOString().slice(0, 10);

      try {
        const [{ data: budgets }, { data: agg, error: aggError }] = await Promise.all([
          supabase
            .from("budgets")
            .select("category_id, month, amount, categories(name)")
            .eq("user_id", user.id)
            .eq("month", monthKey),
          supabase
            .from("transactions")
            .select("amount, category_id")
            .eq("user_id", user.id)
            .gte("date", startStr)
            .lt("date", nextStr),
        ]);
        if (aggError) {
          console.error("[Chat API] getBudgetStatus transactions error:", aggError);
        }
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
            month: monthKey,
            budget_amount,
            spent_amount,
            remaining_amount: budget_amount - spent_amount,
          });
        }
        return out;
      } catch (e) {
        console.error("[Chat API] getBudgetStatus unexpected error:", e);
        return [];
      }
    },
  });

  const getRecurringMerchants = tool<Record<string, never>, RecurringRow[]>({
    description: "List detected recurring merchants with average amount and last seen date",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const { data, error } = await supabase
          .from("recurring_merchants")
          .select("merchant_name, avg_amount, last_seen")
          .eq("user_id", user.id)
          .order("merchant_name");
        if (error) {
          console.error("[Chat API] getRecurringMerchants error:", error);
          return [];
        }
        return (data as RecurringRow[]) ?? [];
      } catch (e) {
        console.error("[Chat API] getRecurringMerchants unexpected error:", e);
        return [];
      }
    },
  });

  const getCachedInsight = tool<{ key: string }, { key: string; value: unknown; computed_at: string } | null>({
    description: "Fetch a cached insight by key for the user",
    inputSchema: z.object({ key: z.string() }),
    execute: async ({ key }) => {
      try {
        const { data, error } = await supabase
          .from("insight_cache")
          .select("value, computed_at")
          .eq("user_id", user.id)
          .eq("cache_key", key)
          .single();
        if (error && error.code !== "PGRST116") {
          console.error("[Chat API] getCachedInsight error:", error);
          return null;
        }
        if (!data) return null;
        return { key, value: data.value as unknown, computed_at: data.computed_at };
      } catch (e) {
        console.error("[Chat API] getCachedInsight unexpected error:", e);
        return null;
      }
    },
  });

  // ==================== WATCHLIST TOOLS ====================

  const getWatchlist = tool<Record<string, never>, WatchlistRow[]>({
    description: "Get the user's stock watchlist with symbols, target prices, and alert settings",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const { data, error } = await supabase
          .from("user_watchlists")
          .select("id, symbol, added_at, target_price, alerts_enabled, notes")
          .eq("user_id", user.id)
          .order("added_at", { ascending: false });
        if (error) {
          console.error("[Chat API] getWatchlist error:", error);
          return [];
        }
        return (data as WatchlistRow[]) ?? [];
      } catch (e) {
        console.error("[Chat API] getWatchlist unexpected error:", e);
        return [];
      }
    },
  });

  const addToWatchlist = tool<{ symbol: string; targetPrice?: number; notes?: string }, { success: boolean; message: string; symbol?: string }>({
    description: "Add a stock symbol to the user's watchlist. Can optionally set a target price and notes.",
    inputSchema: z.object({
      symbol: z.string().min(1).max(10).describe("Stock ticker symbol (e.g., AAPL, GOOGL, TSLA)"),
      targetPrice: z.number().positive().optional().describe("Optional target price for alerts"),
      notes: z.string().max(500).optional().describe("Optional notes about why they're watching this stock"),
    }),
    execute: async ({ symbol, targetPrice, notes }) => {
      try {
        const upperSymbol = symbol.toUpperCase().trim();
        const { error } = await supabase
          .from("user_watchlists")
          .upsert({
            user_id: user.id,
            symbol: upperSymbol,
            target_price: targetPrice || null,
            notes: notes || null,
            alerts_enabled: !!targetPrice,
          }, { onConflict: "user_id,symbol" });
        if (error) {
          console.error("[Chat API] addToWatchlist error:", error);
          return { success: false, message: `Failed to add ${upperSymbol} to watchlist` };
        }
        return { success: true, message: `Added ${upperSymbol} to your watchlist${targetPrice ? ` with target price $${targetPrice}` : ''}`, symbol: upperSymbol };
      } catch (e) {
        console.error("[Chat API] addToWatchlist unexpected error:", e);
        return { success: false, message: "An error occurred" };
      }
    },
  });

  const removeFromWatchlist = tool<{ symbol: string }, { success: boolean; message: string }>({
    description: "Remove a stock symbol from the user's watchlist",
    inputSchema: z.object({
      symbol: z.string().min(1).max(10).describe("Stock ticker symbol to remove"),
    }),
    execute: async ({ symbol }) => {
      try {
        const upperSymbol = symbol.toUpperCase().trim();
        const { error } = await supabase
          .from("user_watchlists")
          .delete()
          .eq("user_id", user.id)
          .eq("symbol", upperSymbol);
        if (error) {
          console.error("[Chat API] removeFromWatchlist error:", error);
          return { success: false, message: `Failed to remove ${upperSymbol}` };
        }
        return { success: true, message: `Removed ${upperSymbol} from your watchlist` };
      } catch (e) {
        console.error("[Chat API] removeFromWatchlist unexpected error:", e);
        return { success: false, message: "An error occurred" };
      }
    },
  });

  const setWatchlistAlert = tool<{ symbol: string; targetPrice: number | null; alertsEnabled: boolean }, { success: boolean; message: string }>({
    description: "Set or update price alerts for a stock on the watchlist",
    inputSchema: z.object({
      symbol: z.string().min(1).max(10).describe("Stock ticker symbol"),
      targetPrice: z.number().positive().nullable().describe("Target price for alerts, or null to clear"),
      alertsEnabled: z.boolean().describe("Whether to enable price alerts"),
    }),
    execute: async ({ symbol, targetPrice, alertsEnabled }) => {
      try {
        const upperSymbol = symbol.toUpperCase().trim();
        const { error } = await supabase
          .from("user_watchlists")
          .update({ target_price: targetPrice, alerts_enabled: alertsEnabled })
          .eq("user_id", user.id)
          .eq("symbol", upperSymbol);
        if (error) {
          console.error("[Chat API] setWatchlistAlert error:", error);
          return { success: false, message: `Failed to update alerts for ${upperSymbol}` };
        }
        return { success: true, message: `Updated ${upperSymbol}: alerts ${alertsEnabled ? 'enabled' : 'disabled'}${targetPrice ? ` at $${targetPrice}` : ''}` };
      } catch (e) {
        console.error("[Chat API] setWatchlistAlert unexpected error:", e);
        return { success: false, message: "An error occurred" };
      }
    },
  });

  // ==================== NOTIFICATION TOOLS ====================

  const getNotificationSchedules = tool<Record<string, never>, NotificationScheduleRow[]>({
    description: "Get all notification schedules for the user (weekly reports, budget alerts, market alerts, etc.)",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const { data, error } = await supabase
          .from("notification_schedules")
          .select("id, schedule_type, is_enabled, cron_expression, discord_guild_id")
          .eq("user_id", user.id);
        if (error) {
          console.error("[Chat API] getNotificationSchedules error:", error);
          return [];
        }
        return (data as NotificationScheduleRow[]) ?? [];
      } catch (e) {
        console.error("[Chat API] getNotificationSchedules unexpected error:", e);
        return [];
      }
    },
  });

  const enableNotification = tool<{ scheduleType: string; cronExpression?: string }, { success: boolean; message: string }>({
    description: "Enable a notification schedule. Types: weekly_report, daily_summary, budget_alert, market_alert",
    inputSchema: z.object({
      scheduleType: z.enum(["weekly_report", "daily_summary", "budget_alert", "market_alert"]).describe("Type of notification to enable"),
      cronExpression: z.string().optional().describe("Optional cron expression for custom timing"),
    }),
    execute: async ({ scheduleType, cronExpression }) => {
      try {
        const defaultCrons: Record<string, string> = {
          weekly_report: "0 10 * * 0",
          daily_summary: "0 18 * * *",
          budget_alert: "0 9 * * *",
          market_alert: "0 14-21 * * 1-5",
        };
        const { error } = await supabase
          .from("notification_schedules")
          .upsert({
            user_id: user.id,
            schedule_type: scheduleType,
            is_enabled: true,
            cron_expression: cronExpression || defaultCrons[scheduleType],
          }, { onConflict: "user_id,schedule_type" });
        if (error) {
          console.error("[Chat API] enableNotification error:", error);
          return { success: false, message: `Failed to enable ${scheduleType}` };
        }
        const friendlyNames: Record<string, string> = {
          weekly_report: "Weekly Financial Report",
          daily_summary: "Daily Transaction Summary",
          budget_alert: "Budget Alerts",
          market_alert: "Market & Watchlist Alerts",
        };
        return { success: true, message: `Enabled ${friendlyNames[scheduleType]}` };
      } catch (e) {
        console.error("[Chat API] enableNotification unexpected error:", e);
        return { success: false, message: "An error occurred" };
      }
    },
  });

  const disableNotification = tool<{ scheduleType: string }, { success: boolean; message: string }>({
    description: "Disable a notification schedule",
    inputSchema: z.object({
      scheduleType: z.enum(["weekly_report", "daily_summary", "budget_alert", "market_alert"]).describe("Type of notification to disable"),
    }),
    execute: async ({ scheduleType }) => {
      try {
        const { error } = await supabase
          .from("notification_schedules")
          .update({ is_enabled: false })
          .eq("user_id", user.id)
          .eq("schedule_type", scheduleType);
        if (error) {
          console.error("[Chat API] disableNotification error:", error);
          return { success: false, message: `Failed to disable ${scheduleType}` };
        }
        const friendlyNames: Record<string, string> = {
          weekly_report: "Weekly Financial Report",
          daily_summary: "Daily Transaction Summary",
          budget_alert: "Budget Alerts",
          market_alert: "Market & Watchlist Alerts",
        };
        return { success: true, message: `Disabled ${friendlyNames[scheduleType]}` };
      } catch (e) {
        console.error("[Chat API] disableNotification unexpected error:", e);
        return { success: false, message: "An error occurred" };
      }
    },
  });

  // ==================== BUDGET TOOLS ====================

  const createBudget = tool<{ categoryName: string; amount: number; month?: string }, { success: boolean; message: string }>({
    description: "Create or update a budget for a spending category",
    inputSchema: z.object({
      categoryName: z.string().describe("Name of the category (e.g., Groceries, Entertainment, Dining)"),
      amount: z.number().positive().describe("Monthly budget amount in dollars"),
      month: z.string().optional().describe("Month in YYYY-MM format. Defaults to current month."),
    }),
    execute: async ({ categoryName, amount, month }) => {
      try {
        const monthKey = month || new Date().toISOString().slice(0, 7);
        // First, find or create the category
        let { data: category } = await supabase
          .from("categories")
          .select("id")
          .eq("user_id", user.id)
          .ilike("name", categoryName)
          .single();

        if (!category) {
          // Create the category
          const { data: newCat, error: catError } = await supabase
            .from("categories")
            .insert({ user_id: user.id, name: categoryName, type: "expense" })
            .select("id")
            .single();
          if (catError) {
            console.error("[Chat API] createBudget category error:", catError);
            return { success: false, message: `Failed to create category ${categoryName}` };
          }
          category = newCat;
        }

        // Upsert the budget
        const { error } = await supabase
          .from("budgets")
          .upsert({
            user_id: user.id,
            category_id: category.id,
            month: monthKey,
            amount,
          }, { onConflict: "user_id,category_id,month" });

        if (error) {
          console.error("[Chat API] createBudget error:", error);
          return { success: false, message: "Failed to create budget" };
        }
        return { success: true, message: `Set $${amount} budget for ${categoryName} in ${monthKey}` };
      } catch (e) {
        console.error("[Chat API] createBudget unexpected error:", e);
        return { success: false, message: "An error occurred" };
      }
    },
  });

  const deleteBudget = tool<{ categoryName: string; month?: string }, { success: boolean; message: string }>({
    description: "Delete a budget for a category",
    inputSchema: z.object({
      categoryName: z.string().describe("Name of the category"),
      month: z.string().optional().describe("Month in YYYY-MM format. Defaults to current month."),
    }),
    execute: async ({ categoryName, month }) => {
      try {
        const monthKey = month || new Date().toISOString().slice(0, 7);
        // Find the category
        const { data: category } = await supabase
          .from("categories")
          .select("id")
          .eq("user_id", user.id)
          .ilike("name", categoryName)
          .single();

        if (!category) {
          return { success: false, message: `Category ${categoryName} not found` };
        }

        const { error } = await supabase
          .from("budgets")
          .delete()
          .eq("user_id", user.id)
          .eq("category_id", category.id)
          .eq("month", monthKey);

        if (error) {
          console.error("[Chat API] deleteBudget error:", error);
          return { success: false, message: "Failed to delete budget" };
        }
        return { success: true, message: `Removed budget for ${categoryName} in ${monthKey}` };
      } catch (e) {
        console.error("[Chat API] deleteBudget unexpected error:", e);
        return { success: false, message: "An error occurred" };
      }
    },
  });

  console.log("[Chat API] Parsing request body...");
  const { messages }: { messages: UIMessage[] } = await req.json();
  
  // Log the request for debugging
  console.log("[Chat API] Messages count:", messages?.length || 0);
  if (messages && messages.length > 0) {
    console.log("[Chat API] First message:", JSON.stringify(messages[0], null, 2));
    console.log("[Chat API] Last message:", JSON.stringify(messages[messages.length - 1], null, 2));
  }

  console.log("[Chat API] Creating streamText with OpenAI...");
  
  // Save user message to chat history
  if (messages && messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'user') {
      // Support both legacy `content` and v5 `parts` formats
      let userContent: string | undefined = undefined;
      // Handle legacy content format
      const messageWithContent = lastMessage as { content?: string };
      if (typeof messageWithContent.content === 'string') {
        userContent = messageWithContent.content;
      } else if (Array.isArray((lastMessage as { parts?: unknown }).parts)) {
        const parts = (lastMessage as { parts: Array<{ type: string; text?: string }> }).parts;
        userContent = parts.filter(p => p && p.type === 'text' && typeof p.text === 'string').map(p => p.text as string).join("\n\n");
      }

      if (userContent && userContent.length > 0) {
        const { error: saveError } = await supabase
          .from('chat_history')
          .insert({
            user_id: user.id,
            session_id: sessionId,
            role: 'user',
            content: userContent,
            metadata: {}
          });
        if (saveError) {
          console.error("[Chat API] Failed to save user message:", saveError);
        } else {
          console.log("[Chat API] User message saved to history");
        }
      } else {
        console.warn("[Chat API] Skipped saving user message: empty content");
      }
    }
  }
  
  try {
    // Convert UIMessages to model messages format
    const modelMessages = convertToModelMessages(messages);
    
    // IMPORTANT: Do NOT await streamText when using streaming response methods
    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: modelMessages,
      system: `You are MAMA, a helpful personal finance assistant with full control over the user's account settings.

CAPABILITIES:
- View financial data: transactions, balances, budgets, spending by category
- Manage watchlist: add/remove stocks, set price alerts and target prices
- Control notifications: enable/disable weekly reports, budget alerts, market alerts, daily summaries
- Manage budgets: create/update/delete monthly budgets for spending categories

GUIDELINES:
- Use tools to fetch real data before answering questions
- When asked to "add", "watch", "track", "enable", "set up", etc., use the appropriate write tools
- Confirm actions after completing them (e.g., "Done! I've added AAPL to your watchlist")
- Never say "undefined" or "null" - say "no data" instead
- Be concise with bullet points and totals
- For write operations, always confirm what was done`,
      tools: {
        // Read tools
        getRecentTransactions, getSpendingByCategory, getAccountBalances, getBudgetStatus, getRecurringMerchants, getCachedInsight,
        // Watchlist tools
        getWatchlist, addToWatchlist, removeFromWatchlist, setWatchlistAlert,
        // Notification tools
        getNotificationSchedules, enableNotification, disableNotification,
        // Budget tools
        createBudget, deleteBudget,
      },
      toolChoice: 'auto',
      onFinish: async ({ text, usage, finishReason }) => {
        // Save assistant's response to chat history
        if (text) {
          const { error: saveError } = await supabase
            .from('chat_history')
            .insert({
              user_id: user.id,
              session_id: sessionId,
              role: 'assistant',
              content: text,
              metadata: { usage, finishReason }
            });
          
          if (saveError) {
            console.error("[Chat API] Failed to save assistant message:", saveError);
          } else {
            console.log("[Chat API] Assistant message saved to history");
          }
        }
      },
      onError: (err) => {
        console.error("[Chat API] streamText error:", err);
      }
    });

    console.log("[Chat API] Streaming response created successfully");
    
    // Return the UI message stream response - works with useChat hook
    return result.toUIMessageStreamResponse({
      headers: {
        'x-session-id': sessionId
      }
    });
  } catch (streamError) {
    console.error("[Chat API] Failed to create stream:", streamError);
    throw streamError;
  }
  } catch (error) {
    console.error("[Chat API] Error caught in main handler:", error);
    console.error("[Chat API] Error stack:", error instanceof Error ? error.stack : "No stack");
    console.error("[Chat API] Error type:", typeof error);
    console.error("[Chat API] Error details:", JSON.stringify(error, null, 2));
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined
      }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
