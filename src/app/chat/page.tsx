"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";

type TextPart = { type: "text"; text: string };
type ToolCallPart = { type: "tool-call"; toolName: string; args: unknown };
type ToolResultPart = { type: "tool-result"; result: unknown; toolCallId: string; toolName: string };

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
  const { messages, sendMessage, status, stop } = useChat({
    api: "/api/chat"
  });
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

  const handleQuickPrompt = (prompt: string) => {
    sendMessage({ text: prompt });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().length === 0) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-black flex flex-col">
      {/* Header */}
      <div className="bg-[#f5f0e8] dark:bg-zinc-900 border-b border-[#e8dfd2] dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">AI Financial Assistant</h1>
              <p className="text-xs text-[#7d6754] dark:text-zinc-400">
                Ask questions about your finances and get instant insights
              </p>
            </div>
            <a 
              href="/dashboard" 
              className="text-sm text-[#7d6754] dark:text-zinc-400 hover:text-[#3d3028] dark:hover:text-zinc-200"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-[#d4c4b0] dark:text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <h2 className="text-lg font-semibold mb-2">Start a conversation</h2>
              <p className="text-sm text-[#7d6754] dark:text-zinc-400 mb-6 max-w-sm mx-auto">
                Ask me anything about your finances. I can help with spending analysis, budgets, and financial insights.
              </p>
              
              {/* Quick Prompts */}
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="px-3 py-1.5 text-sm bg-[#f5f0e8] dark:bg-zinc-900 border border-[#d4c4b0] dark:border-zinc-700 rounded-lg hover:bg-[#e8dfd2] dark:hover:bg-zinc-800 transition-colors"
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
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7a95a7] to-[#9b826f] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          AI
                        </div>
                      )}
                      <div className="flex-1">
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            message.role === "user"
                              ? "bg-[#7d6754] text-[#faf8f5]"
                              : "bg-[#f5f0e8] dark:bg-zinc-900 border border-[#e8dfd2] dark:border-zinc-700"
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
                              return null; // Tool results are processed internally
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

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="border-t border-[#e8dfd2] dark:border-zinc-800 pt-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={status === "streaming" ? "AI is responding..." : "Ask about your finances..."}
              disabled={status === "streaming"}
              className="flex-1 px-4 py-3 rounded-xl border border-[#d4c4b0] dark:border-zinc-700 bg-[#faf8f5] dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#7a95a7] disabled:opacity-50"
            />
            {status === "streaming" ? (
              <button
                type="button"
                onClick={stop}
                className="px-6 py-3 bg-[#c17767] text-white rounded-xl hover:bg-[#a85d4d] transition-colors"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={input.trim().length === 0}
                className="px-6 py-3 bg-[#7a95a7] text-white rounded-xl hover:bg-[#6b8599] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            )}
          </div>
          <p className="text-xs text-[#9b826f] dark:text-zinc-400 mt-2">
            Tip: I can analyze transactions, check balances, review budgets, and identify spending patterns.
          </p>
        </form>
      </div>
    </div>
  );
}