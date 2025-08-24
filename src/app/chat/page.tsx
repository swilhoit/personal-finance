"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";

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
    if (items.length === 0) return <div className="text-xs italic text-cyan-600 dark:text-cyan-400">No spending data found 📊</div>;
    return (
      <div className="mt-3 bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-xl p-4 border-2 border-cyan-300 dark:border-cyan-700">
        <div className="font-['Rubik_Mono_One'] text-sm text-cyan-700 dark:text-cyan-300 mb-2 flex items-center gap-2">
          <span className="text-lg">💰</span> SPENDING BY CATEGORY (30 DAYS)
        </div>
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white/50 dark:bg-gray-900/50 rounded-lg px-3 py-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">{it.category || "Uncategorized"}</span>
              <span className="font-['Bungee'] text-cyan-600 dark:text-cyan-400">${it.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (toolName === "getRecentTransactions" && Array.isArray(result)) {
    const rows = result as Array<{ date: string; name: string | null; merchant_name: string | null; amount: number; iso_currency_code: string | null; category: string | null }>;
    if (rows.length === 0) return <div className="text-xs italic text-cyan-600 dark:text-cyan-400">No recent transactions 💸</div>;
    return (
      <div className="mt-3 bg-gradient-to-r from-sky-50 to-cyan-50 dark:from-sky-900/20 dark:to-cyan-900/20 rounded-xl p-4 border-2 border-sky-300 dark:border-sky-700">
        <div className="font-['Rubik_Mono_One'] text-sm text-sky-700 dark:text-sky-300 mb-2 flex items-center gap-2">
          <span className="text-lg">💸</span> RECENT TRANSACTIONS
        </div>
        <div className="space-y-1">
          {rows.slice(0, 10).map((t, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white/50 dark:bg-gray-900/50 rounded-lg px-3 py-1.5 text-sm">
              <div className="flex-1">
                <span className="font-medium text-gray-700 dark:text-gray-300">{t.merchant_name || t.name || "Transaction"}</span>
                <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">{t.category}</span>
              </div>
              <div className="text-right">
                <span className="font-['Bungee'] text-sky-600 dark:text-sky-400">${Number(t.amount).toFixed(2)}</span>
                <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">{t.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (toolName === "getAccountBalances" && Array.isArray(result)) {
    const rows = result as Array<{ name: string | null; official_name: string | null; current_balance: number | null; available_balance: number | null; iso_currency_code: string | null }>;
    if (rows.length === 0) return <div className="text-xs italic text-cyan-600 dark:text-cyan-400">No accounts found 🏦</div>;
    return (
      <div className="mt-3 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-4 border-2 border-teal-300 dark:border-teal-700">
        <div className="font-['Rubik_Mono_One'] text-sm text-teal-700 dark:text-teal-300 mb-2 flex items-center gap-2">
          <span className="text-lg">🏦</span> ACCOUNT BALANCES
        </div>
        <div className="space-y-2">
          {rows.map((a, idx) => (
            <div key={idx} className="bg-white/50 dark:bg-gray-900/50 rounded-lg px-3 py-2">
              <div className="font-medium text-gray-700 dark:text-gray-300">{a.name || a.official_name || "Account"}</div>
              <div className="font-['Bungee'] text-xl text-teal-600 dark:text-teal-400">
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
    if (rows.length === 0) return <div className="text-xs italic text-cyan-600 dark:text-cyan-400">No budgets set 📊</div>;
    return (
      <div className="mt-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border-2 border-purple-300 dark:border-purple-700">
        <div className="font-['Rubik_Mono_One'] text-sm text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-2">
          <span className="text-lg">📊</span> BUDGET STATUS ({rows[0]?.month})
        </div>
        <div className="space-y-2">
          {rows.map((b, idx) => {
            const percentUsed = (b.spent_amount / b.budget_amount) * 100;
            const isOverBudget = percentUsed > 100;
            return (
              <div key={idx} className="bg-white/50 dark:bg-gray-900/50 rounded-lg px-3 py-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{b.category_name}</span>
                  <span className={`font-['Bungee'] text-sm ${isOverBudget ? 'text-red-500' : 'text-green-500'}`}>
                    {isOverBudget ? '⚠️ OVER' : '✅ OK'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 mb-1">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      isOverBudget ? 'bg-red-500' : percentUsed > 75 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percentUsed, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Spent: ${b.spent_amount.toFixed(2)}</span>
                  <span>Budget: ${b.budget_amount.toFixed(2)}</span>
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
  { text: "What's my balance?", emoji: "💰" },
  { text: "Monthly spending?", emoji: "📊" },
  { text: "Top categories", emoji: "🏆" },
  { text: "Recent transactions", emoji: "💸" },
  { text: "Budget status", emoji: "🎯" },
  { text: "Spending trends", emoji: "📈" },
  { text: "Find recurring", emoji: "🔄" },
  { text: "Food spending", emoji: "🍔" },
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
      if (err.message?.includes("503") || err.message?.includes("not configured")) {
        setError("AI chat is not configured. Please add OPENAI_API_KEY to your environment variables.");
      } else if (err.message?.includes("401") || err.message?.includes("Unauthorized")) {
        setError("You need to be logged in to use the AI chat.");
      } else {
        setError(`Chat error: ${err.message || "Failed to connect to AI service"}`);
      }
    }
  });

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
    } catch (_) {}
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
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        redirect("/auth/sign-in");
      }
    };
    checkAuth();
  }, []);

  const handleQuickPrompt = async (prompt: string) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-teal-50 dark:from-gray-900 dark:via-cyan-950 dark:to-teal-950 flex flex-col">
      
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b-4 border-cyan-400 dark:border-cyan-600 relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                fontSize: '1.5rem',
                opacity: 0.2,
              }}
            >
              {['💰', '🤖', '📊', '🎮'][Math.floor(Math.random() * 4)]}
            </div>
          ))}
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-['Bungee'] bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent flex items-center gap-3">
                <span className="text-4xl">🤖</span> AI ADVISOR
              </h1>
              <p className="text-sm font-['Rubik_Mono_One'] text-gray-600 dark:text-gray-400 mt-1">
                YOUR PERSONAL FINANCE CO-PILOT
              </p>
            </div>
            <a 
              href="/dashboard" 
              className="hidden sm:flex items-center gap-2 px-4 py-2 font-['Rubik_Mono_One'] text-sm bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-xl hover:bg-cyan-200 dark:hover:bg-cyan-900/50 transition-all hover:scale-105"
            >
              <span>← BACK</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col">
        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600 rounded-xl">
            <div className="flex gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="font-['Rubik_Mono_One'] text-sm text-red-600 dark:text-red-400">ERROR DETECTED</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 scroll-smooth">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-8xl mb-6 animate-bounce">🤖</div>
              <h2 className="text-3xl font-['Bungee'] mb-3 bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
                START QUEST
              </h2>
              <p className="font-['Rubik_Mono_One'] text-sm text-gray-600 dark:text-gray-400 mb-8 max-w-sm mx-auto">
                ASK ME ANYTHING ABOUT YOUR MONEY - I'M HERE TO HELP YOU WIN!
              </p>
              
              {/* Quick Prompts Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickPrompt(prompt.text)}
                    className="group relative px-4 py-3 bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-900/30 dark:to-teal-900/30 border-2 border-cyan-400 dark:border-cyan-600 rounded-xl hover:scale-105 transition-all"
                  >
                    <span className="text-2xl mb-1 block group-hover:animate-wiggle">{prompt.emoji}</span>
                    <span className="font-['Rubik_Mono_One'] text-xs text-gray-700 dark:text-gray-300">{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-slideIn`}
                >
                  <div className={`max-w-[80%] ${message.role === "user" ? "order-2" : ""}`}>
                    <div className="flex items-start gap-3">
                      {message.role === "assistant" && (
                        <div className="relative">
                          <div className="absolute inset-0 bg-cyan-400 dark:bg-cyan-600 rounded-xl blur-lg opacity-50"></div>
                          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white text-xl shadow-lg">
                            🤖
                          </div>
                        </div>
                      )}
                      <div className="flex-1">
                        <div
                          className={`rounded-2xl px-5 py-4 shadow-lg ${
                            message.role === "user"
                              ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-['Rubik_Mono_One']"
                              : "bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-2 border-cyan-400 dark:border-cyan-600"
                          }`}
                        >
                          {message.parts.map((part, partIndex) => {
                            if (isTextPart(part)) {
                              return (
                                <div key={partIndex} className={`whitespace-pre-wrap ${
                                  message.role === "assistant" ? "text-gray-800 dark:text-gray-200" : ""
                                }`}>
                                  {part.text}
                                </div>
                              );
                            }
                            if (isToolCallPart(part)) {
                              return (
                                <div key={partIndex} className="flex items-center gap-2 text-sm text-cyan-600 dark:text-cyan-400 italic mt-2">
                                  <div className="animate-spin">⚙️</div>
                                  <span className="font-['Rubik_Mono_One']">
                                    LOADING {part.toolName.replace(/([A-Z])/g, " $1").toUpperCase()}...
                                  </span>
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
                          <div className="text-xs font-['Rubik_Mono_One'] text-gray-500 dark:text-gray-500 mt-2 px-2">
                            {new Date().toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        )}
                      </div>
                      {message.role === "user" && (
                        <div className="relative">
                          <div className="absolute inset-0 bg-orange-400 dark:bg-orange-600 rounded-xl blur-lg opacity-50"></div>
                          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-['Bungee'] text-sm shadow-lg">
                            P1
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {status === "streaming" && (
                <div className="flex justify-start animate-slideIn">
                  <div className="flex items-center gap-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl px-4 py-3 border-2 border-cyan-400 dark:border-cyan-600">
                    <div className="flex gap-1">
                      <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-3 h-3 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="font-['Rubik_Mono_One'] text-sm text-cyan-700 dark:text-cyan-300">AI THINKING...</span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="border-t-4 border-cyan-400 dark:border-cyan-600 pt-4 pb-safe">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={status === "streaming" ? "AI IS TYPING..." : "TYPE YOUR QUESTION..."}
                disabled={status === "streaming"}
                className="w-full px-5 py-4 rounded-2xl border-3 border-cyan-400 dark:border-cyan-600 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm font-['Rubik_Mono_One'] text-sm focus:outline-none focus:ring-4 focus:ring-cyan-300 dark:focus:ring-cyan-700 disabled:opacity-50 placeholder:text-gray-400"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-2xl opacity-50">
                💬
              </div>
            </div>
            {status === "streaming" ? (
              <button
                type="button"
                onClick={stop}
                className="px-6 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl font-['Rubik_Mono_One'] hover:scale-105 transition-all shadow-lg hover:shadow-red-500/50"
              >
                STOP
              </button>
            ) : (
              <button
                type="submit"
                disabled={input.trim().length === 0}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-2xl font-['Rubik_Mono_One'] hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/50"
              >
                SEND 🚀
              </button>
            )}
          </div>
          <p className="text-xs font-['Rubik_Mono_One'] text-gray-500 dark:text-gray-500 mt-3 text-center">
            💡 PRO TIP: ASK ABOUT SPENDING, BUDGETS, BALANCES, OR FINANCIAL PATTERNS
          </p>
        </form>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }

        @keyframes wiggle {
          0%, 100% {
            transform: rotate(-3deg);
          }
          50% {
            transform: rotate(3deg);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-wiggle {
          animation: wiggle 0.5s ease-in-out;
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}