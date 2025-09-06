"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";

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
    if (items.length === 0) return <div className="text-xs italic text-cyan-600">No data 📊</div>;
    return (
      <div className="mt-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-2 text-xs">
        <div className="font-['Rubik_Mono_One'] text-cyan-700 dark:text-cyan-300 mb-1">💰 SPENDING</div>
        {items.slice(0, 5).map((it, idx) => (
          <div key={idx} className="flex justify-between py-0.5">
            <span>{it.category || "Other"}</span>
            <span className="font-['Bungee'] text-cyan-600 dark:text-cyan-400">${it.total.toFixed(0)}</span>
          </div>
        ))}
      </div>
    );
  }
  if (toolName === "getRecentTransactions" && Array.isArray(result)) {
    const rows = result as Array<{ date: string; merchant_name: string | null; amount: number }>;
    if (rows.length === 0) return <div className="text-xs italic text-cyan-600">No transactions 💸</div>;
    return (
      <div className="mt-2 bg-sky-50 dark:bg-sky-900/20 rounded-lg p-2 text-xs">
        <div className="font-['Rubik_Mono_One'] text-sky-700 dark:text-sky-300 mb-1">💸 RECENT</div>
        {rows.slice(0, 5).map((t, idx) => (
          <div key={idx} className="flex justify-between py-0.5">
            <span className="truncate flex-1">{t.merchant_name || "Transaction"}</span>
            <span className="font-['Bungee'] text-sky-600 dark:text-sky-400">${Number(t.amount).toFixed(0)}</span>
          </div>
        ))}
      </div>
    );
  }
  if (toolName === "getAccountBalances" && Array.isArray(result)) {
    const rows = result as Array<{ name: string | null; current_balance: number | null }>;
    if (rows.length === 0) return <div className="text-xs italic text-cyan-600">No accounts 🏦</div>;
    return (
      <div className="mt-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg p-2 text-xs">
        <div className="font-['Rubik_Mono_One'] text-teal-700 dark:text-teal-300 mb-1">🏦 BALANCES</div>
        {rows.map((a, idx) => (
          <div key={idx} className="py-0.5">
            <div className="text-gray-600 dark:text-gray-400">{a.name || "Account"}</div>
            <div className="font-['Bungee'] text-lg text-teal-600 dark:text-teal-400">
              ${Number(a.current_balance ?? 0).toFixed(0)}
            </div>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

const quickActions = [
  { text: "Balance?", emoji: "💰" },
  { text: "Spending", emoji: "📊" },
  { text: "Recent", emoji: "💸" },
  { text: "Budget?", emoji: "🎯" },
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);
  
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
      } else if (err.message?.includes("401")) {
        setError("Please log in");
      } else {
        setError("Connection error");
      }
    },
  });
  
  // Voice functionality moved to dedicated voice chat page - removed from ChatWidget

  // Voice call functionality removed - use dedicated voice chat page instead
  
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

  return (
    <>
      {/* Floating Button - Hidden on mobile */}
      <button
        onClick={() => setOpen(!open)}
        className={`hidden md:block fixed bottom-6 right-6 z-50 transition-all transform hover:scale-110 ${
          open ? "scale-0 opacity-0" : "scale-100 opacity-100"
        }`}
        aria-label="Open AI chat"
      >
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-teal-400 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity animate-pulse"></div>
          
          {/* Button */}
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-2xl border-2 border-cyan-400 dark:border-cyan-600">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-[200%] h-[200%] object-cover translate-x-0 -translate-y-[25%]"
            >
              <source src="/hero-video.mp4" type="video/mp4" />
            </video>
          </div>
          
          {/* Notification dot */}
          {messages.length > 0 && !open && (
            <div className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500"></span>
            </div>
          )}
          
          {/* Speech bubble - "Chat Now!" */}
          <div className="absolute bottom-full right-0 mb-4 px-3 py-2 bg-yellow-400 text-gray-900 text-sm font-bold rounded-2xl shadow-lg animate-bounce whitespace-nowrap font-['Rubik_Mono_One'] border-2 border-yellow-500">
            CHAT NOW! 💬
            {/* Speech bubble tail */}
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-yellow-400"></div>
          </div>
          
          {/* Hover text */}
          <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-['Rubik_Mono_One']">
            CHAT WITH AI
          </div>
        </div>
      </button>

      {/* Chat Window - Hidden on mobile */}
      <div
        className={`hidden md:block fixed z-50 transition-all transform ${
          open ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        } ${
          minimized ? "bottom-6 right-6" : "bottom-6 right-6"
        }`}
      >
        <div className={`bg-white dark:bg-gray-900 shadow-2xl rounded-3xl border-4 border-cyan-400 dark:border-cyan-600 overflow-hidden transition-all ${
          minimized ? "w-[320px] h-[80px]" : "w-[400px] h-[600px]"
        }`}>
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-cyan-500 via-sky-500 to-teal-500 text-white flex items-center justify-between relative">
            {/* Grid pattern background */}
            <div className="absolute inset-0 opacity-30 overflow-hidden">
              <div className="absolute inset-0 bg-grid-pattern"></div>
            </div>
            
            <div className="relative flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>
              </div>
              <span className="font-['Bungee'] text-lg">AI ADVISOR</span>
            </div>
            
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => setMinimized(!minimized)}
                className="hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                aria-label="Minimize chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={minimized ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                </svg>
              </button>
              <a
                href="/voice-chat"
                className="hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                aria-label="Voice chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </a>
              <a
                href="/chat"
                className="hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                aria-label="Full chat view"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                </svg>
              </a>
              <button
                onClick={() => setOpen(false)}
                className="hover:bg-white/20 rounded-lg p-1.5 transition-colors"
                aria-label="Close chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {error && (
                <div className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-b-2 border-red-400 dark:border-red-600 text-xs font-['Rubik_Mono_One'] flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 h-[calc(100%-140px)]">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="relative w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-cyan-400 dark:border-cyan-600 animate-bounce">
                      <video 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="w-[200%] h-[200%] object-cover translate-x-0 -translate-y-[25%]"
                      >
                        <source src="/hero-video.mp4" type="video/mp4" />
                      </video>
                    </div>
                    <p className="font-['Bungee'] text-lg text-cyan-600 dark:text-cyan-400 mb-2">
                      READY TO HELP!
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-['Rubik_Mono_One']">
                      Ask about your money
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleQuickAction(action.text)}
                          className="px-3 py-2 bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-900/30 dark:to-teal-900/30 rounded-xl hover:scale-105 transition-all border-2 border-cyan-400 dark:border-cyan-600 font-['Rubik_Mono_One'] text-xs text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2"
                        >
                          <span className="text-lg">{action.emoji}</span>
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
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-slideIn`}
                      >
                        <div className={`max-w-[85%] flex items-start gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                          {/* Avatar */}
                          {message.role === "user" ? (
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-yellow-400 to-orange-500">
                              <span className="text-white text-sm">P1</span>
                            </div>
                          ) : (
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-cyan-400/50 dark:border-cyan-600/50">
                              <video 
                                autoPlay 
                                loop 
                                muted 
                                playsInline
                                className="w-[200%] h-[200%] object-cover translate-x-0 -translate-y-[25%]"
                              >
                                <source src="/hero-video.mp4" type="video/mp4" />
                              </video>
                            </div>
                          )}
                          
                          {/* Message bubble */}
                          <div
                            className={`rounded-2xl px-4 py-3 text-sm ${
                              message.role === "user"
                                ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-['Rubik_Mono_One']"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-2 border-cyan-400 dark:border-cyan-600"
                            }`}
                          >
                            {message.parts.map((part, i) => {
                              if (isTextPart(part)) {
                                return <span key={i} className="whitespace-pre-wrap block">{part.text}</span>;
                              }
                              if (isToolCallPart(part)) {
                                return (
                                  <div key={i} className="flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 italic mt-1">
                                    <span className="animate-spin">⚙️</span>
                                    <span className="font-['Rubik_Mono_One']">LOADING...</span>
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
                      </div>
                    ))}
                    
                    {status === "streaming" && (
                      <div className="flex justify-start animate-slideIn">
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 border-2 border-cyan-400 dark:border-cyan-600">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                          <span className="text-xs font-['Rubik_Mono_One'] text-cyan-700 dark:text-cyan-300">THINKING...</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
                <form onSubmit={handleSubmit} className="border-t-4 border-cyan-400 dark:border-cyan-600 p-3 bg-gray-50 dark:bg-gray-900/50">
                  <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={status === "streaming" ? "AI TYPING..." : "ASK SOMETHING..."}
                    disabled={status === "streaming"}
                    className="flex-1 px-3 py-2 rounded-xl border-2 border-cyan-400 dark:border-cyan-600 bg-white dark:bg-gray-900 font-['Rubik_Mono_One'] text-xs focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:focus:ring-cyan-700 disabled:opacity-50 placeholder:text-gray-400"
                  />
                  {status === "streaming" ? (
                    <button
                      type="button"
                      onClick={stop}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-['Rubik_Mono_One'] text-xs hover:scale-105 transition-all"
                    >
                      STOP
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => window.open('/voice-true-realtime', '_blank')}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-['Rubik_Mono_One'] text-xs hover:scale-105 transition-all flex items-center gap-1"
                      >
                        🎤 VOICE
                      </button>
                      <button
                        type="submit"
                        disabled={input.trim().length === 0}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl font-['Rubik_Mono_One'] text-xs hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        SEND
                      </button>
                    </>
                  )}
                  </div>
                </form>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(5deg);
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

        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
}