"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";

type TextPart = { type: "text"; text: string };

function isTextPart(part: unknown): part is TextPart {
  if (typeof part !== "object" || part === null) return false;
  const maybe = part as { type?: unknown; text?: unknown };
  return maybe.type === "text" && typeof maybe.text === "string";
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [messages, open]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="w-[360px] h-[480px] bg-white dark:bg-zinc-900 shadow-xl rounded-xl flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
          <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <span className="font-medium">AI Finance Assistant</span>
            <button onClick={() => setOpen(false)} className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">Close</button>
          </div>
          <div ref={ref} className="flex-1 overflow-auto p-3 space-y-2 text-sm">
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                <div className={`inline-block max-w-[80%] px-3 py-2 rounded-lg ${m.role === "user" ? "bg-blue-600 text-white" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                  {m.parts.filter(isTextPart).map((p, i) => (
                    <span key={i}>{p.text}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim().length === 0) return;
              sendMessage({ text: input });
              setInput("");
            }}
            className="p-3 border-t border-zinc-200 dark:border-zinc-800"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={status === "streaming" ? "Thinking..." : "Ask about your spending, balances, trends..."}
              className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none"
            />
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-black text-white dark:bg-white dark:text-black px-4 py-2 shadow-lg"
      >
        {open ? "Hide Chat" : "Chat"}
      </button>
    </div>
  );
}
