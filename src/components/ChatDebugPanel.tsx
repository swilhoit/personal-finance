"use client";

import { useState, useEffect } from "react";

export default function ChatDebugPanel() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Intercept console logs
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      originalLog(...args);
      const message = args.map(arg => 
        typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(" ");
      
      if (message.includes("[Chat") || message.includes("[chat") || message.includes("sendMessage")) {
        setLogs(prev => [...prev.slice(-19), `[${new Date().toLocaleTimeString()}] ${message}`]);
      }
    };

    console.error = (...args) => {
      originalError(...args);
      const message = args.map(arg => 
        typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(" ");
      
      if (message.includes("[Chat") || message.includes("[chat") || message.includes("sendMessage")) {
        setLogs(prev => [...prev.slice(-19), `[ERROR ${new Date().toLocaleTimeString()}] ${message}`]);
      }
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  // Check health endpoint
  useEffect(() => {
    const checkHealth = async () => {
      try {
        console.log("[Debug Panel] Checking chat health...");
        const response = await fetch("/api/chat/health");
        const data = await response.json();
        console.log("[Debug Panel] Health response:", data);
        setHealthStatus(data);
      } catch (err) {
        console.error("[Debug Panel] Health check failed:", err);
        setError(String(err));
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Test chat API directly
  const testChatAPI = async () => {
    try {
      console.log("[Debug Panel] Testing chat API directly...");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              parts: [{ type: "text", text: "Test message" }]
            }
          ]
        }),
      });

      console.log("[Debug Panel] Test response status:", response.status);
      console.log("[Debug Panel] Test response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Debug Panel] Test failed with error:", errorText);
        setError(`API test failed: ${response.status} - ${errorText}`);
      } else {
        const reader = response.body?.getReader();
        if (reader) {
          const { value } = await reader.read();
          const text = new TextDecoder().decode(value);
          console.log("[Debug Panel] Test response (first chunk):", text);
        }
      }
    } catch (err) {
      console.error("[Debug Panel] Test API error:", err);
      setError(`Test failed: ${String(err)}`);
    }
  };

  return (
    <div className="fixed bottom-20 left-4 z-50 w-96 max-h-96 bg-black/90 text-green-400 p-4 rounded-lg font-mono text-xs overflow-auto">
      <div className="mb-2 text-yellow-400">🔍 Chat Debug Panel</div>
      
      <div className="mb-3">
        <div className="text-cyan-400 mb-1">Health Status:</div>
        {healthStatus ? (
          <div className="ml-2">
            <div>Status: {healthStatus.status}</div>
            <div>OpenAI: {healthStatus.openai_configured ? "✅ Configured" : "❌ Not configured"}</div>
            <div>Time: {new Date(healthStatus.timestamp).toLocaleTimeString()}</div>
          </div>
        ) : (
          <div className="ml-2 text-gray-400">Checking...</div>
        )}
      </div>

      {error && (
        <div className="mb-3 text-red-400">
          <div className="mb-1">Error:</div>
          <div className="ml-2 text-xs">{error}</div>
        </div>
      )}

      <button
        onClick={testChatAPI}
        className="mb-3 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
      >
        Test Chat API
      </button>

      <div className="mb-1 text-cyan-400">Console Logs:</div>
      <div className="h-48 overflow-y-auto bg-black/50 p-2 rounded text-xs">
        {logs.length === 0 ? (
          <div className="text-gray-400">No chat-related logs yet...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className={log.includes("ERROR") ? "text-red-400" : "text-green-400"}>
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
}