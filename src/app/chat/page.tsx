"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
import ChatDebugPanel from "@/components/ChatDebugPanel";

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
        <div className="mt-2 text-sm">
          <div className="font-semibold mb-1">Spending by category (last 30 days):</div>
          <ul className="list-disc ml-5 space-y-0.5">
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
        <div className="mt-2 text-sm">
          <div className="font-semibold mb-1">Recent transactions:</div>
          <ul className="list-disc ml-5 space-y-0.5">
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
        <div className="mt-2 text-sm">
          <div className="font-semibold mb-1">Account balances:</div>
          <ul className="list-disc ml-5 space-y-0.5">
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
        <div className="mt-2 text-sm">
          <div className="font-semibold mb-1">Budgets ({rows[0]?.month}):</div>
          <ul className="list-disc ml-5 space-y-0.5">
            {rows.map((b, idx) => (
              <li key={idx}>{b.category_name}: Budget ${b.budget_amount.toFixed(2)}, Spent ${b.spent_amount.toFixed(2)}, Remaining ${b.remaining_amount.toFixed(2)}</li>
            ))}
          </ul>
        </div>
      );
    }
    // Default: don't render unknown tool results
    return null;
  }

  function renderToolResult(part: ToolResultPart) {
    return renderToolResultByName(part.toolName, part.result);
  }

  function renderDynamicToolUIPart(part: DynamicToolUIPart) {
    const type = part.type; // e.g. tool-getSpendingByCategory
    const name = type.replace(/^tool-/, "");
    if (part.state === "output-available") {
      return renderToolResultByName(name, part.output);
    }
    return null;
  }

const quickPrompts = [
  "What's my current balance?",
  "How much did I spend this month?",
  "Show me my top spending categories",
  "What are my recent transactions?",
  "Am I over budget this month?",
  "Show me spending trends",
  "Find recurring payments",
  "How much did I spend on food?",
];

export default function ChatPage() {
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
      console.error("[Chat Page] Chat error details:", err);
      console.error("[Chat Page] Error stack:", err.stack);
      if (err.message?.includes("503") || err.message?.includes("not configured")) {
        setError("AI chat is not configured. Please add OPENAI_API_KEY to your environment variables on Vercel.");
      } else if (err.message?.includes("401") || err.message?.includes("Unauthorized")) {
        setError("You need to be logged in to use the AI chat.");
      } else {
        setError(`Chat error: ${err.message || "Failed to connect to AI service"}`);
      }
    }
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
    console.log("[Chat Page] Initialized - Status:", status);
    console.log("[Chat Page] SendMessage type:", typeof sendMessage);
  }, [status, sendMessage]);
  
  // Log every status change
  useEffect(() => {
    console.log("[Chat Page] Status changed to:", status);
  }, [status]);
  
  // Log every messages change
  useEffect(() => {
    console.log("[Chat Page] Messages updated, count:", messages.length);
    if (messages.length > 0) {
      console.log("[Chat Page] Latest message:", messages[messages.length - 1]);
    }
  }, [messages]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        redirect("/auth/sign-in");
      }
    };
    checkAuth();
  }, []);

  const handleQuickPrompt = async (prompt: string) => {
    console.log("[Chat Page] Quick prompt clicked:", prompt);
    console.log("[Chat Page] Calling sendMessage with prompt...");
    try {
      const sid = sessionId ?? (() => {
        const id = crypto.randomUUID();
        try { if (typeof window !== "undefined") localStorage.setItem("chat_session_id", id); } catch {}
        setSessionId(id);
        return id;
      })();
      const result = await sendMessage({
        role: "user",
        parts: [{ type: "text", text: prompt }]
      }, { headers: { "x-session-id": sid } });
      console.log("[Chat Page] SendMessage result:", result);
    } catch (err) {
      console.error("[Chat Page] SendMessage failed:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[Chat Page] Form submitted with input:", input);
    if (input.trim().length === 0) {
      console.log("[Chat Page] Input is empty, returning");
      return;
    }
    const message = input;
    setInput("");
    console.log("[Chat Page] Calling sendMessage with message:", message);
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
      console.log("[Chat Page] SendMessage result:", result);
    } catch (err) {
      console.error("[Chat Page] SendMessage failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Debug Panel - Only in development */}
      {process.env.NODE_ENV === "development" && <ChatDebugPanel />}
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">AI Financial Assistant</h1>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Ask questions about your finances and get instant insights
              </p>
            </div>
            <a 
              href="/dashboard" 
              className="hidden sm:block text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>

      {/* Main Chat Area - Full height on mobile */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col">
        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Configuration Required</p>
                <p className="text-xs text-gray-600 dark:text-zinc-400 mt-1">{error}</p>
                <p className="text-xs text-gray-600 dark:text-zinc-400 mt-2">
                  To enable AI chat, add the OPENAI_API_KEY environment variable in your Vercel project settings.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <h2 className="text-lg font-semibold mb-2">Start a conversation</h2>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 max-w-sm mx-auto">
                Ask me anything about your finances. I can help with spending analysis, budgets, and financial insights.
              </p>
              
              {/* Quick Prompts */}
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {prompt}
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
                  <div className={`max-w-[80%] ${message.role === "user" ? "order-2" : ""}`}>
                    <div className="flex items-start gap-3">
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 dark:from-[#7a95a7] dark:to-[#9b826f] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          AI
                        </div>
                      )}
                      <div className="flex-1">
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            message.role === "user"
                              ? "bg-blue-600 dark:bg-[#7d6754] text-white"
                              : "bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700"
                          }`}
                        >
                          {message.parts.map((part, partIndex) => {
                            if (isTextPart(part)) {
                              return (
                                <div key={partIndex} className="whitespace-pre-wrap">
                                  {part.text}
                                </div>
                              );
                            }
                            if (isToolCallPart(part)) {
                              return (
                                <div key={partIndex} className="text-xs text-[#9b826f] dark:text-zinc-400 italic mt-2">
                                  Fetching {part.toolName.replace(/([A-Z])/g, " $1").toLowerCase()}...
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
                        {message.role === "assistant" && (
                          <div className="text-xs text-[#9b826f] dark:text-zinc-400 mt-1 px-1">
                            {new Date().toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        )}
                      </div>
                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-[#e8dfd2] dark:bg-zinc-800 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          You
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {status === "streaming" && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 text-sm text-[#9b826f] dark:text-zinc-400">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[#7a95a7] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-[#7a95a7] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-[#7a95a7] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    AI is thinking...
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form - Fixed at bottom on mobile */}
        <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-zinc-800 pt-4 pb-safe">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={status === "streaming" ? "AI is responding..." : "Ask about your finances..."}
              disabled={status === "streaming"}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#7a95a7] disabled:opacity-50"
            />
            {status === "streaming" ? (
              <button
                type="button"
                onClick={stop}
                className="px-4 sm:px-6 py-3 bg-red-600 dark:bg-[#c17767] text-white rounded-xl hover:bg-red-700 dark:hover:bg-[#a85d4d] transition-colors"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={input.trim().length === 0}
                className="px-4 sm:px-6 py-3 bg-blue-600 dark:bg-[#7a95a7] text-white rounded-xl hover:bg-blue-700 dark:hover:bg-[#6b8599] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2">
            Tip: I can analyze transactions, check balances, review budgets, and identify spending patterns.
          </p>
        </form>
      </div>
    </div>
  );
}