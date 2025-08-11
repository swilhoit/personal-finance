"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";

type TextPart = { type: "text"; text: string };

function isTextPart(part: unknown): part is TextPart {
  if (typeof part !== "object" || part === null) return false;
  const maybe = part as { type?: unknown; text?: unknown };
  return maybe.type === "text" && typeof maybe.text === "string";
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
  const { messages, sendMessage, status, stop } = useChat();
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

  const handleQuickAction = (action: string) => {
    sendMessage({ text: action });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().length === 0) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-4 right-4 z-50 rounded-full shadow-lg transition-all ${
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

      {/* Chat Window */}
      <div
        className={`fixed bottom-4 right-4 z-50 transition-all transform ${
          open ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        }`}
      >
        <div className="w-[380px] h-[600px] bg-[#f5f0e8] dark:bg-zinc-900 shadow-2xl rounded-2xl flex flex-col overflow-hidden border border-[#e8dfd2] dark:border-zinc-800">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-[#7a95a7] to-[#9b826f] text-white flex items-center justify-between">
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
                      {message.parts.filter(isTextPart).map((part, i) => (
                        <span key={i} className="whitespace-pre-wrap">{part.text}</span>
                      ))}
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