"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";

type TextPart = { type: "text"; text: string };
type ToolCallPart = { type: "tool-call"; toolName: string; args: unknown };
type ToolResultPart = { type: "tool-result"; result: unknown; toolCallId: string; toolName: string };
type DynamicToolUIPart = {
  type: string; // e.g. "tool-getSpendingByCategory"
  toolCallId: string;
  state?: string; // e.g. "output-available"
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
    if (items.length === 0) return <div className="text-xs italic text-[#9b826f] dark:text-zinc-400">No spending found.</div>;
    return (
      <div className="mt-1.5 text-xs">
        <div className="font-medium mb-0.5">Spending by category:</div>
        <ul className="list-disc ml-4 space-y-0.5">
          {items.map((it, idx) => (
            <li key={idx}>{it.category || "Uncategorized"}: ${it.total.toFixed(2)}</li>
          ))}
        </ul>
      </div>
    );
  }
  if (toolName === "getRecentTransactions" && Array.isArray(result)) {
    const rows = result as Array<{ date: string; name: string | null; merchant_name: string | null; amount: number; iso_currency_code: string | null; category: string | null }>;
    if (rows.length === 0) return <div className="text-xs italic text-[#9b826f] dark:text-zinc-400">No recent transactions.</div>;
    return (
      <div className="mt-1.5 text-xs">
        <div className="font-medium mb-0.5">Recent transactions:</div>
        <ul className="list-disc ml-4 space-y-0.5">
          {rows.slice(0, 10).map((t, idx) => (
            <li key={idx}>{t.date}: {(t.merchant_name || t.name || "Transaction")} — ${Number(t.amount).toFixed(2)} {t.iso_currency_code || ""} {t.category ? `(${t.category})` : ""}</li>
          ))}
        </ul>
      </div>
    );
  }
  if (toolName === "getAccountBalances" && Array.isArray(result)) {
    const rows = result as Array<{ name: string | null; official_name: string | null; current_balance: number | null; available_balance: number | null; iso_currency_code: string | null }>;
    if (rows.length === 0) return <div className="text-xs italic text-[#9b826f] dark:text-zinc-400">No accounts.</div>;
    return (
      <div className="mt-1.5 text-xs">
        <div className="font-medium mb-0.5">Account balances:</div>
        <ul className="list-disc ml-4 space-y-0.5">
          {rows.map((a, idx) => (
            <li key={idx}>{a.name || a.official_name || "Account"}: ${Number(a.current_balance ?? 0).toFixed(2)} {a.iso_currency_code || ""}</li>
          ))}
        </ul>
      </div>
    );
  }
  if (toolName === "getBudgetStatus" && Array.isArray(result)) {
    const rows = result as Array<{ category_name: string; budget_amount: number; spent_amount: number; remaining_amount: number; month: string }>;
    if (rows.length === 0) return <div className="text-xs italic text-[#9b826f] dark:text-zinc-400">No budgets for this month.</div>;
    return (
      <div className="mt-1.5 text-xs">
        <div className="font-medium mb-0.5">Budgets ({rows[0]?.month}):</div>
        <ul className="list-disc ml-4 space-y-0.5">
          {rows.map((b, idx) => (
            <li key={idx}>{b.category_name}: Budget ${b.budget_amount.toFixed(2)}, Spent ${b.spent_amount.toFixed(2)}, Remaining ${b.remaining_amount.toFixed(2)}</li>
          ))}
        </ul>
      </div>
    );
  }
  return null;
}

const quickActions = [
  "What's my balance?",
  "Recent spending",
  "Monthly summary",
  "Am I on budget?",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const { 
    messages, 
    sendMessage,
    stop,
    status
  } = useChat({
    onError: (err) => {
      console.error("[ChatWidget] Chat error:", err);
      console.error("[ChatWidget] Error stack:", err.stack);
      if (err.message?.includes("503") || err.message?.includes("not configured")) {
        setError("AI chat is not configured. Please add OPENAI_API_KEY to your environment variables on Vercel.");
      } else if (err.message?.includes("401") || err.message?.includes("Unauthorized")) {
        setError("You need to be logged in to use the AI chat.");
      } else {
        setError(`Chat error: ${err.message || "Failed to connect to AI service"}`);
      }
    },
  });
  
  // Ensure a stable session id for chat history threading
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
    } catch (_) {
      // ignore storage errors
    }
  }, []);

  // Log initialization after first render
  useEffect(() => {
    console.log("[ChatWidget] Initialized - Status:", status);
    console.log("[ChatWidget] SendMessage type:", typeof sendMessage);
  }, [status, sendMessage]);
  
  // Log status changes
  useEffect(() => {
    console.log("[ChatWidget] Status changed to:", status);
  }, [status]);
  
  // Log messages changes
  useEffect(() => {
    console.log("[ChatWidget] Messages updated, count:", messages.length);
    if (messages.length > 0) {
      console.log("[ChatWidget] Latest message:", messages[messages.length - 1]);
    }
  }, [messages]);
  
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
    console.log("[ChatWidget] Quick action clicked:", action);
    console.log("[ChatWidget] Calling sendMessage...");
    try {
      // guarantee we always send a session id
      const sid = sessionId ?? (() => {
        const id = crypto.randomUUID();
        try { if (typeof window !== "undefined") localStorage.setItem("chat_session_id", id); } catch {}
        setSessionId(id);
        return id;
      })();
      const result = await sendMessage({
        role: "user",
        parts: [{ type: "text", text: action }]
      }, { headers: { "x-session-id": sid } });
      console.log("[ChatWidget] SendMessage result:", result);
    } catch (err) {
      console.error("[ChatWidget] SendMessage failed:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[ChatWidget] Form submitted with input:", input);
    if (input.trim().length === 0) {
      console.log("[ChatWidget] Input is empty, returning");
      return;
    }
    const message = input;
    setInput("");
    console.log("[ChatWidget] Calling sendMessage with message:", message);
    try {
      const sid = sessionId ?? (() => {
        const id = crypto.randomUUID();
        try { if (typeof window !== "undefined") localStorage.setItem("chat_session_id", id); } catch {}
        setSessionId(id);
        return id;
      })();
      const result = await sendMessage({
        role: "user",
        parts: [{ type: "text", text: message }]
      }, { headers: { "x-session-id": sid } });
      console.log("[ChatWidget] SendMessage result:", result);
    } catch (err) {
      console.error("[ChatWidget] SendMessage failed:", err);
    }
  };

  return (
    <>
      {/* Floating Button - Hidden on mobile since chat is in nav */}
      <button
        onClick={() => setOpen(!open)}
        className={`hidden md:block fixed bottom-4 right-4 z-50 rounded-full shadow-lg transition-all ${
          open ? "scale-0" : "scale-100"
        }`}
        aria-label="Open chat"
      >
        <div className="relative">
          <div className="w-14 h-14 bg-gradient-to-br from-[#7a95a7] to-[#9b826f] rounded-full flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          {messages.length > 0 && !open && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>
      </button>

      {/* Chat Window - Hidden on mobile since we have dedicated page */}
      <div
        className={`hidden md:block fixed bottom-4 right-4 z-50 transition-all transform ${
          open ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        }`}
      >
        <div className="w-[380px] h-[600px] bg-white dark:bg-zinc-900 shadow-2xl rounded-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-zinc-800">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-[#7a95a7] dark:to-[#9b826f] text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="font-semibold">AI Assistant</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/chat"
                className="text-xs opacity-90 hover:opacity-100 underline"
              >
                Full View
              </a>
              <button
                onClick={() => setOpen(false)}
                className="hover:bg-white/20 rounded-lg p-1 transition-colors"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-2 bg-[#c17767]/10 text-[#7d6754] border-b border-[#c17767]/30 text-xs">
              {error}
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto mb-3 text-[#d4c4b0] dark:text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-sm text-[#7d6754] dark:text-zinc-400 mb-4">
                  Hi! I can help you understand your finances.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action)}
                      className="px-3 py-1.5 text-xs bg-[#faf8f5] dark:bg-zinc-800 rounded-full hover:bg-[#e8dfd2] dark:hover:bg-zinc-700 transition-colors"
                    >
                      {action}
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
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        message.role === "user"
                          ? "bg-[#7d6754] text-[#faf8f5]"
                          : "bg-[#faf8f5] dark:bg-zinc-800 text-[#3d3028] dark:text-zinc-100"
                      }`}
                    >
                      {message.parts.map((part, i) => {
                        if (isTextPart(part)) {
                          return <span key={i} className="whitespace-pre-wrap">{part.text}</span>;
                        }
                        if (isToolCallPart(part)) {
                          return (
                            <div key={i} className="text-[11px] text-[#9b826f] dark:text-zinc-400 italic mt-1">
                              Fetching {part.toolName.replace(/([A-Z])/g, " $1").toLowerCase()}...
                            </div>
                          );
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
                ))}
                {status === "streaming" && (
                  <div className="flex justify-start">
                    <div className="bg-[#faf8f5] dark:bg-zinc-800 rounded-2xl px-3 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-[#9b826f] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-[#9b826f] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-[#9b826f] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-[#e8dfd2] dark:border-zinc-800">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={status === "streaming" ? "AI is thinking..." : "Ask me anything..."}
                disabled={status === "streaming"}
                className="flex-1 px-3 py-2 text-sm rounded-full border border-[#d4c4b0] dark:border-zinc-700 bg-[#faf8f5] dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#7a95a7] disabled:opacity-50"
              />
              {status === "streaming" ? (
                <button
                  type="button"
                  onClick={stop}
                  className="px-4 py-2 text-sm bg-[#c17767] text-white rounded-full hover:bg-[#a85d4d] transition-colors"
                >
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={input.trim().length === 0}
                  className="px-4 py-2 text-sm bg-[#7a95a7] text-white rounded-full hover:bg-[#6b8599] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}