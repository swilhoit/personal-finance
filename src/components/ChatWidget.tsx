"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { createSupabaseClient } from "@/lib/supabase/client";

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

// Tool name to friendly name mapping
const toolDisplayNames: Record<string, { name: string; icon: string; color: string }> = {
  getRecentTransactions: { name: "Fetching transactions", icon: "↺", color: "text-blue-600" },
  getSpendingByCategory: { name: "Analyzing spending", icon: "↗", color: "text-purple-600" },
  getAccountBalances: { name: "Checking balances", icon: "◎", color: "text-green-600" },
  getBudgetStatus: { name: "Checking budgets", icon: "▣", color: "text-orange-600" },
  getRecurringMerchants: { name: "Finding subscriptions", icon: "↻", color: "text-cyan-600" },
  getCachedInsight: { name: "Loading insights", icon: "◈", color: "text-indigo-600" },
  getWatchlist: { name: "Loading watchlist", icon: "★", color: "text-yellow-600" },
  addToWatchlist: { name: "Adding to watchlist", icon: "＋", color: "text-emerald-600" },
  removeFromWatchlist: { name: "Removing from watchlist", icon: "－", color: "text-red-600" },
  setWatchlistAlert: { name: "Setting price alert", icon: "⚡", color: "text-amber-600" },
  getNotificationSchedules: { name: "Loading notifications", icon: "🔔", color: "text-blue-600" },
  enableNotification: { name: "Enabling notification", icon: "✓", color: "text-emerald-600" },
  disableNotification: { name: "Disabling notification", icon: "✗", color: "text-gray-600" },
  createBudget: { name: "Creating budget", icon: "＋", color: "text-emerald-600" },
  deleteBudget: { name: "Removing budget", icon: "－", color: "text-red-600" },
};

function ToolCallIndicator({ toolName }: { toolName: string }) {
  const display = toolDisplayNames[toolName] || { name: toolName, icon: "⋯", color: "text-gray-600" };
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 bg-gray-50 rounded-md border border-gray-200 mt-1">
      <div className="w-4 h-4 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin" />
      <span className={`text-xs ${display.color}`}>{display.icon}</span>
      <span className="text-xs text-gray-600">{display.name}...</span>
    </div>
  );
}

function renderToolResultByName(toolName: string, result: unknown) {
  // Handle action results (write operations)
  if (typeof result === "object" && result !== null && "success" in result) {
    const actionResult = result as { success: boolean; message: string; symbol?: string };
    const display = toolDisplayNames[toolName] || { icon: "•", color: "text-gray-600" };
    return (
      <div className={`mt-1 flex items-center gap-2 py-1.5 px-2 rounded-md text-xs ${
        actionResult.success ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"
      }`}>
        <span className={actionResult.success ? "text-emerald-600" : "text-red-600"}>
          {actionResult.success ? "✓" : "✗"}
        </span>
        <span className={actionResult.success ? "text-emerald-700" : "text-red-700"}>
          {actionResult.message}
        </span>
      </div>
    );
  }

  if (toolName === "getSpendingByCategory" && Array.isArray(result)) {
    const items = result as Array<{ category: string; total: number }>;
    if (items.length === 0) return <div className="text-xs text-gray-500">No data</div>;
    return (
      <div className="mt-2 bg-gray-50 rounded-lg p-3 text-xs border border-gray-200">
        <div className="font-medium text-gray-700 mb-2 uppercase tracking-wide text-[10px]">Spending</div>
        {items.slice(0, 5).map((it, idx) => (
          <div key={idx} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
            <span className="text-gray-600">{it.category || "Other"}</span>
            <span className="font-medium text-gray-900">${it.total.toFixed(0)}</span>
          </div>
        ))}
      </div>
    );
  }
  if (toolName === "getRecentTransactions" && Array.isArray(result)) {
    const rows = result as Array<{ date: string; merchant_name: string | null; amount: number }>;
    if (rows.length === 0) return <div className="text-xs text-gray-500">No transactions</div>;
    return (
      <div className="mt-2 bg-gray-50 rounded-lg p-3 text-xs border border-gray-200">
        <div className="font-medium text-gray-700 mb-2 uppercase tracking-wide text-[10px]">Recent</div>
        {rows.slice(0, 5).map((t, idx) => (
          <div key={idx} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
            <span className="text-gray-600 truncate flex-1">{t.merchant_name || "Transaction"}</span>
            <span className="font-medium text-gray-900">${Number(t.amount).toFixed(0)}</span>
          </div>
        ))}
      </div>
    );
  }
  if (toolName === "getAccountBalances" && Array.isArray(result)) {
    const rows = result as Array<{ name: string | null; current_balance: number | null }>;
    if (rows.length === 0) return <div className="text-xs text-gray-500">No accounts</div>;
    return (
      <div className="mt-2 bg-gray-50 rounded-lg p-3 text-xs border border-gray-200">
        <div className="font-medium text-gray-700 mb-2 uppercase tracking-wide text-[10px]">Balances</div>
        {rows.map((a, idx) => (
          <div key={idx} className="py-1 border-b border-gray-100 last:border-0">
            <div className="text-gray-500 text-[10px]">{a.name || "Account"}</div>
            <div className="font-medium text-gray-900 text-sm">
              ${Number(a.current_balance ?? 0).toFixed(0)}
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (toolName === "getWatchlist" && Array.isArray(result)) {
    const rows = result as Array<{ symbol: string; target_price: number | null; alerts_enabled: boolean }>;
    if (rows.length === 0) return <div className="text-xs text-gray-500">No stocks in watchlist</div>;
    return (
      <div className="mt-2 bg-gray-50 rounded-lg p-3 text-xs border border-gray-200">
        <div className="font-medium text-gray-700 mb-2 uppercase tracking-wide text-[10px]">Watchlist</div>
        {rows.slice(0, 8).map((s, idx) => (
          <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
            <span className="font-medium text-gray-900">{s.symbol}</span>
            <div className="flex items-center gap-2">
              {s.target_price && <span className="text-gray-500">${s.target_price}</span>}
              {s.alerts_enabled && <span className="text-amber-500 text-[10px]">⚡</span>}
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (toolName === "getNotificationSchedules" && Array.isArray(result)) {
    const rows = result as Array<{ schedule_type: string; is_enabled: boolean }>;
    if (rows.length === 0) return <div className="text-xs text-gray-500">No notifications configured</div>;
    const friendlyNames: Record<string, string> = {
      weekly_report: "Weekly Report",
      daily_summary: "Daily Summary",
      budget_alert: "Budget Alerts",
      market_alert: "Market Alerts",
    };
    return (
      <div className="mt-2 bg-gray-50 rounded-lg p-3 text-xs border border-gray-200">
        <div className="font-medium text-gray-700 mb-2 uppercase tracking-wide text-[10px]">Notifications</div>
        {rows.map((n, idx) => (
          <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
            <span className="text-gray-600">{friendlyNames[n.schedule_type] || n.schedule_type}</span>
            <span className={n.is_enabled ? "text-emerald-600" : "text-gray-400"}>
              {n.is_enabled ? "●" : "○"}
            </span>
          </div>
        ))}
      </div>
    );
  }
  if (toolName === "getBudgetStatus" && Array.isArray(result)) {
    const rows = result as Array<{ category_name: string; budget_amount: number; spent_amount: number; remaining_amount: number }>;
    if (rows.length === 0) return <div className="text-xs text-gray-500">No budgets set</div>;
    return (
      <div className="mt-2 bg-gray-50 rounded-lg p-3 text-xs border border-gray-200">
        <div className="font-medium text-gray-700 mb-2 uppercase tracking-wide text-[10px]">Budgets</div>
        {rows.map((b, idx) => {
          const pct = b.budget_amount > 0 ? (b.spent_amount / b.budget_amount) * 100 : 0;
          return (
            <div key={idx} className="py-1.5 border-b border-gray-100 last:border-0">
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">{b.category_name}</span>
                <span className={pct > 90 ? "text-red-600" : pct > 70 ? "text-amber-600" : "text-gray-900"}>
                  ${b.spent_amount.toFixed(0)} / ${b.budget_amount.toFixed(0)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}

const quickActions = [
  { text: "Balance", icon: "◎" },
  { text: "Spending", icon: "↗" },
  { text: "Watchlist", icon: "★" },
  { text: "Budgets", icon: "▣" },
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const {
    messages,
    sendMessage,
    stop,
    status
  } = useChat({
    onError: (err) => {
      console.error("[ChatWidget] Chat error:", err);
      if (err.message?.includes("503") || err.message?.includes("not configured")) {
        setError("AI not configured");
      } else if (err.message?.includes("401") || err.message?.includes("Unauthorized")) {
        // Clear potentially corrupt session and show login prompt
        handleAuthError();
      } else {
        setError("Connection error");
      }
    },
  });

  const handleAuthError = async () => {
    try {
      const supabase = createSupabaseClient();
      await supabase.auth.signOut();
      setError("Session expired. Please log in again.");
    } catch {
      setError("Please log in");
    }
  };

  // Check auth status on mount with error handling
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createSupabaseClient();
        const { error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("[ChatWidget] Session error:", sessionError);
          // Don't show error, just mark as checked - widget will show login prompt if needed
        }
      } catch (err) {
        console.error("[ChatWidget] Auth check error:", err);
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, []);

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

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleQuickAction = async (action: string) => {
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
        parts: [{ type: "text", text: action }]
      }, { headers: { "x-session-id": sid } });
    } catch (err) {
      console.error("[ChatWidget] SendMessage failed:", err);
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
      console.error("[ChatWidget] SendMessage failed:", err);
    }
  };

  if (!authChecked) return null;

  return (
    <>
      {/* Floating Button - Circular Video */}
      <button
        onClick={() => setOpen(!open)}
        className={`hidden md:flex fixed bottom-6 right-6 z-[200] items-center justify-center w-14 h-14 rounded-full overflow-hidden shadow-lg hover:scale-105 transition-all border-2 border-emerald-500/50 ${
          open ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
        aria-label="Open AI chat"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-[200%] h-[200%] object-cover -translate-y-[10%]"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        {messages.length > 0 && !open && (
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Chat Window - RIGHT SIDE */}
      <div
        className={`hidden md:block fixed z-[200] transition-all duration-300 ease-out ${
          open ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
        } top-10 right-0 bottom-0`}
      >
        <div className={`bg-white shadow-2xl border-l border-gray-200 overflow-hidden transition-all duration-200 h-full flex flex-col ${
          minimized ? "w-72" : "w-80"
        }`}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2">
              {/* Small circular video in header */}
              <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-500/30">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-[200%] h-[200%] object-cover -translate-y-[10%]"
                >
                  <source src="/hero-video.mp4" type="video/mp4" />
                </video>
              </div>
              <span className="text-sm font-medium text-gray-900">MAMA</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized(!minimized)}
                className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                aria-label={minimized ? "Expand" : "Minimize"}
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={minimized ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                </svg>
              </button>
              <a
                href="/chat"
                className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                aria-label="Full view"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
              </a>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                aria-label="Close"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {error && (
                <div className="px-4 py-2 bg-gray-100 text-gray-600 border-b border-gray-200 text-xs flex items-center gap-2">
                  <span>⚠</span> {error}
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-6">
                    {/* Circular video in empty state */}
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full overflow-hidden border border-emerald-500/30">
                      <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-[200%] h-[200%] object-cover -translate-y-[10%]"
                      >
                        <source src="/hero-video.mp4" type="video/mp4" />
                      </video>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      How can I help?
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      Ask about your finances
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickAction(action.text)}
                          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-xs text-gray-700 flex items-center justify-center gap-1.5"
                        >
                          <span className="text-gray-400">{action.icon}</span>
                          <span>{action.text}</span>
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
                        <div className={`max-w-[85%] ${message.role === "user" ? "order-2" : ""}`}>
                          <div
                            className={`rounded-lg px-3 py-2 text-sm ${
                              message.role === "user"
                                ? "bg-emerald-500 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            {message.parts.map((part, i) => {
                              if (isTextPart(part)) {
                                return <span key={i} className="whitespace-pre-wrap block">{part.text}</span>;
                              }
                              if (isToolCallPart(part)) {
                                return <ToolCallIndicator key={i} toolName={part.toolName} />;
                              }
                              if (isToolResultPart(part)) {
                                return <div key={i}>{renderToolResultByName(part.toolName, part.result)}</div>;
                              }
                              if (isDynamicToolUIPart(part)) {
                                const type = part.type;
                                const name = type.replace(/^tool-/, "");
                                if (part.state === "output-available") {
                                  return <div key={i}>{renderToolResultByName(name, part.output)}</div>;
                                }
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      </div>
                    ))}

                    {status === "streaming" && (
                      <div className="flex justify-start">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={status === "streaming" ? "Typing..." : "Ask something..."}
                    disabled={status === "streaming"}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 placeholder:text-gray-400"
                  />
                  {status === "streaming" ? (
                    <button
                      type="button"
                      onClick={stop}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
                    >
                      Stop
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={input.trim().length === 0}
                      className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
