"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";

export default function ChatTestPage() {
  const [manualInput, setManualInput] = useState("");
  
  // Try with default configuration first
  const {
    messages,
    sendMessage,
    error,
    status
  } = useChat({
    // The useChat hook should use /api/chat by default
    onError: (err) => {
      console.error("Chat error full details:", err);
    }
  });

  const handleManualSend = async () => {
    console.log("Using sendMessage with:", manualInput);
    try {
      await sendMessage({
        role: "user",
        content: manualInput
      });
      console.log("sendMessage successful");
    } catch (err) {
      console.error("Error with sendMessage:", err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleManualSend();
  };

  const handleDirectApiCall = async () => {
    console.log("Making direct API call");
    try {
      const response = await fetch("/api/chat-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: manualInput }]
        })
      });
      const text = await response.text();
      console.log("Direct API response:", text);
    } catch (err) {
      console.error("Direct API error:", err);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Chat Test Page</h1>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <p>Status: {status}</p>
        <p>Error: {error?.message || "None"}</p>
        <p>Messages count: {messages.length}</p>
        <p>sendMessage available: {sendMessage ? "Yes" : "No"}</p>
      </div>

      <div className="mb-4">
        <h3 className="font-bold mb-2">Test sendMessage:</h3>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Type message and press Enter"
            className="px-3 py-2 border rounded flex-1"
          />
          <button type="submit" className="px-4 py-2 bg-purple-500 text-white rounded">
            Send Message
          </button>
        </form>
      </div>

      <div className="mb-4">
        <button
          onClick={handleDirectApiCall}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Direct API Call
        </button>
      </div>

      <div className="border-t pt-4">
        <h2 className="font-bold mb-2">Messages:</h2>
        {messages.map((msg, i) => (
          <div key={i} className="mb-2 p-2 bg-gray-100 rounded">
            <strong>{msg.role}:</strong> {JSON.stringify(msg)}
          </div>
        ))}
      </div>
    </div>
  );
}