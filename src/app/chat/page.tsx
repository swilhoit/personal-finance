"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type TextPart = { type: "text"; text: string };
type ToolCallPart = { type: "tool-call"; toolName: string; args: unknown };
type ToolResultPart = { type: "tool-result"; result: unknown; toolCallId: string; toolName: string };
type DynamicToolUIPart = {
  type: string;
  toolCallId: string;
  state?: string;
  input?: unknown;
  output?: unknown;
  callProviderMetadata?: unknown;
};

function isTextPart(part: unknown): part is TextPart {
  if (typeof part !== "object" || part === null) return false;
  const maybe = part as { type?: unknown; text?: unknown };
  return maybe.type === "text" && typeof maybe.text === "string";
}

function isToolCallPart(part: unknown): part is ToolCallPart {
  if (typeof part !== "object" || part === null) return false;
  const maybe = part as { type?: unknown };
  return maybe.type === "tool-call";
}

function isToolResultPart(part: unknown): part is ToolResultPart {
  if (typeof part !== "object" || part === null) return false;
  const maybe = part as { type?: unknown };
  return maybe.type === "tool-result";
}

function isDynamicToolUIPart(part: unknown): part is DynamicToolUIPart {
  if (typeof part !== "object" || part === null) return false;
  const maybe = part as { type?: unknown };
  return typeof maybe.type === "string" && (maybe.type as string).startsWith("tool-");
}

function renderToolResultByName(toolName: string, result: unknown) {
  if (toolName === "getSpendingByCategory" && Array.isArray(result)) {
    const items = result as Array<{ category: string; total: number }>;
    if (items.length === 0) return <div className="text-sm text-gray-500">No spending data found</div>;
    return (
      <div className="mt-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
          Spending by Category
        </div>
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <span className="text-sm text-gray-700 dark:text-gray-300">{it.category || "Uncategorized"}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">${it.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (toolName === "getRecentTransactions" && Array.isArray(result)) {
    const rows = result as Array<{ date: string; name: string | null; merchant_name: string | null; amount: number; iso_currency_code: string | null; category: string | null }>;
    if (rows.length === 0) return <div className="text-sm text-gray-500">No recent transactions</div>;
    return (
      <div className="mt-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
          Recent Transactions
        </div>
        <div className="space-y-1">
          {rows.slice(0, 10).map((t, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div className="flex-1 min-w-0">
                <span className="text-sm text-gray-900 dark:text-gray-100 block truncate">{t.merchant_name || t.name || "Transaction"}</span>
                <span className="text-xs text-gray-500">{t.category} · {t.date}</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100 ml-4">${Number(t.amount).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (toolName === "getAccountBalances" && Array.isArray(result)) {
    const rows = result as Array<{ name: string | null; official_name: string | null; current_balance: number | null; available_balance: number | null; iso_currency_code: string | null }>;
    if (rows.length === 0) return <div className="text-sm text-gray-500">No accounts found</div>;
    return (
      <div className="mt-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
          Account Balances
        </div>
        <div className="space-y-3">
          {rows.map((a, idx) => (
            <div key={idx} className="py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div className="text-sm text-gray-600 dark:text-gray-400">{a.name || a.official_name || "Account"}</div>
              <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                ${Number(a.current_balance ?? 0).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (toolName === "getBudgetStatus" && Array.isArray(result)) {
    const rows = result as Array<{ category_name: string; budget_amount: number; spent_amount: number; remaining_amount: number; month: string }>;
    if (rows.length === 0) return <div className="text-sm text-gray-500">No budgets set</div>;
    return (
      <div className="mt-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
          Budget Status · {rows[0]?.month}
        </div>
        <div className="space-y-3">
          {rows.map((b, idx) => {
            const percentUsed = (b.spent_amount / b.budget_amount) * 100;
            const isOverBudget = percentUsed > 100;
            return (
              <div key={idx} className="py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{b.category_name}</span>
                  <span className={`text-xs font-medium ${isOverBudget ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}>
                    {isOverBudget ? 'Over budget' : `${Math.round(100 - percentUsed)}% left`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all ${
                      isOverBudget ? 'bg-gray-900 dark:bg-gray-100' : 'bg-gray-500'
                    }`}
                    style={{ width: `${Math.min(percentUsed, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>${b.spent_amount.toFixed(0)} spent</span>
                  <span>${b.budget_amount.toFixed(0)} budget</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
}

function renderToolResult(part: ToolResultPart) {
  return renderToolResultByName(part.toolName, part.result);
}

function renderDynamicToolUIPart(part: DynamicToolUIPart) {
  const type = part.type;
  const name = type.replace(/^tool-/, "");
  if (part.state === "output-available") {
    return renderToolResultByName(name, part.output);
  }
  return null;
}

const quickPrompts = [
  { text: "What's my balance?", icon: "◎" },
  { text: "Monthly spending", icon: "↗" },
  { text: "Top categories", icon: "▤" },
  { text: "Recent transactions", icon: "↺" },
  { text: "Budget status", icon: "▣" },
  { text: "Spending trends", icon: "⤴" },
];

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();
  
  const { 
    messages, 
    sendMessage,
    stop,
    status
  } = useChat({
    onError: (err) => {
      console.error("[Chat Page] Chat error details:", err);
      if (err.message?.includes("503") || err.message?.includes("not configured")) {
        setError("AI chat is not configured. Please check environment variables.");
      } else if (err.message?.includes("401") || err.message?.includes("Unauthorized")) {
        handleAuthError();
      } else {
        setError(`Error: ${err.message || "Failed to connect"}`);
      }
    }
  });

  const handleAuthError = async () => {
    try {
      const supabase = createSupabaseClient();
      await supabase.auth.signOut();
      setError("Session expired. Redirecting to sign in...");
      setTimeout(() => router.push("/auth/sign-in"), 1500);
    } catch {
      setError("Authentication error. Please sign in again.");
      router.push("/auth/sign-in");
    }
  };

  useEffect(() => {
    try {
      const key = "chat_session_id";
      const existing = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      if (existing) {
        setSessionId(existing);
      } else {
        const newId = crypto.randomUUID();
        if (typeof window !== "undefined") localStorage.setItem(key, newId);
        setSessionId(newId);
      }
    } catch {}
  }, []);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createSupabaseClient();
        // Use getSession first (doesn't refresh), then getUser only if session exists
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("[Chat Page] Session error:", sessionError);
          // Clear corrupt session
          await supabase.auth.signOut();
          router.push("/auth/sign-in");
          return;
        }

        if (!session) {
          router.push("/auth/sign-in");
          return;
        }

        // Verify the session is still valid
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("[Chat Page] User error:", userError);
          await supabase.auth.signOut();
          router.push("/auth/sign-in");
          return;
        }

        setAuthChecked(true);
      } catch (err) {
        console.error("[Chat Page] Auth check failed:", err);
        router.push("/auth/sign-in");
      }
    };
    checkAuth();
  }, [router]);

  const handleQuickPrompt = async (prompt: string) => {
    setError(null);
    try {
      const sid = sessionId ?? (() => {
        const id = crypto.randomUUID();
        try { if (typeof window !== "undefined") localStorage.setItem("chat_session_id", id); } catch {}
        setSessionId(id);
        return id;
      })();
      await sendMessage({
        role: "user",
        parts: [{ type: "text", text: prompt }]
      }, { headers: { "x-session-id": sid } });
    } catch (err) {
      console.error("[Chat Page] SendMessage failed:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().length === 0) return;
    const message = input;
    setInput("");
    setError(null);
    try {
      const sid = sessionId ?? (() => {
        const id = crypto.randomUUID();
        try { if (typeof window !== "undefined") localStorage.setItem("chat_session_id", id); } catch {}
        setSessionId(id);
        return id;
      })();
      await sendMessage({
        role: "user",
        parts: [{ type: "text", text: message }]
      }, { headers: { "x-session-id": sid } });
    } catch (err) {
      console.error("[Chat Page] SendMessage failed:", err);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Assistant
              </h1>
              <p className="text-sm text-gray-500">
                Ask about your finances
              </p>
            </div>
            <a 
              href="/dashboard" 
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </a>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col">
        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                How can I help?
              </h2>
              <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
                Ask me anything about your spending, budgets, balances, or financial patterns.
              </p>
              
              {/* Quick Prompts Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-lg mx-auto">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickPrompt(prompt.text)}
                    className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <span className="text-gray-400 text-xs block mb-1">{prompt.icon}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] sm:max-w-[75%]`}>
                    <div
                      className={`rounded-lg px-4 py-3 ${
                        message.role === "user"
                          ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                          : "bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {message.parts.map((part, partIndex) => {
                        if (isTextPart(part)) {
                          return (
                            <div key={partIndex} className="whitespace-pre-wrap text-sm">
                              {part.text}
                            </div>
                          );
                        }
                        if (isToolCallPart(part)) {
                          return (
                            <div key={partIndex} className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                              <span>Loading {part.toolName.replace(/([A-Z])/g, " $1").toLowerCase()}...</span>
                            </div>
                          );
                        }
                        if (isToolResultPart(part)) {
                          return <div key={partIndex}>{renderToolResult(part)}</div>;
                        }
                        if (isDynamicToolUIPart(part)) {
                          return <div key={partIndex}>{renderDynamicToolUIPart(part)}</div>;
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              ))}
              
              {status === "streaming" && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 rounded-lg px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-800 pt-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={status === "streaming" ? "Generating response..." : "Ask a question..."}
              disabled={status === "streaming"}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 disabled:opacity-50 placeholder:text-gray-400"
            />
            {status === "streaming" ? (
              <button
                type="button"
                onClick={stop}
                className="px-4 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={input.trim().length === 0}
                className="px-4 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
