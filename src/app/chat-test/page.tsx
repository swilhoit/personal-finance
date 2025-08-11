"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";

export default function ChatTestPage() {
  const [manualInput, setManualInput] = useState("");
  
  // Try with default configuration first
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    append,
    reload,
    stop,
  } = useChat({
    api: "/api/chat",  // Use the real chat endpoint
    onError: (err) => {
      console.error("Chat error full details:", err);
    }
  });

  const handleManualAppend = async () => {
    console.log("Using append with:", manualInput);
    try {
      if (append) {
        await append({
          role: "user",
          content: manualInput
        });
        console.log("Append successful");
      } else {
        console.error("Append method not available");
      }
    } catch (err) {
      console.error("Error with append:", err);
    }
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
        <p>isLoading: {String(isLoading)}</p>
        <p>Error: {error?.message || "None"}</p>
        <p>Messages count: {messages.length}</p>
        <p>Append available: {append ? "Yes" : "No"}</p>
      </div>

      <div className="mb-4">
        <h3 className="font-bold mb-2">Test with built-in form:</h3>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Type message and press Enter"
            className="px-3 py-2 border rounded flex-1"
          />
          <button type="submit" className="px-4 py-2 bg-purple-500 text-white rounded">
            Send (built-in)
          </button>
        </form>
      </div>

      <div className="mb-4">
        <h3 className="font-bold mb-2">Test with manual methods:</h3>
        <input
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          placeholder="Enter test message"
          className="px-3 py-2 border rounded mr-2"
        />
        <button
          onClick={handleManualAppend}
          className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
        >
          Try Append
        </button>
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