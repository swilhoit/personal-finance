"use client";

import { useState } from "react";

export default function TellerConnect() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Get Teller configuration
      const response = await fetch("/api/teller/create-enrollment", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle configuration errors gracefully
        if (response.status === 503) {
          setError("Banking integration is not configured yet. Please contact support.");
          setIsConnecting(false);
          return;
        }
        throw new Error(data.error || "Failed to create enrollment");
      }

      const { applicationId, environment } = data;

      if (!applicationId) {
        setError("Banking service is not properly configured.");
        setIsConnecting(false);
        return;
      }

      // Build Teller Connect URL
      const tellerUrl = `https://teller.io/connect/${applicationId}?environment=${environment}`;

      // Open Teller Connect in popup
      const width = 500;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        tellerUrl,
        "TellerConnect",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        setError("Please allow popups to connect your bank account.");
        setIsConnecting(false);
        return;
      }

      // Poll for completion
      const checkInterval = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkInterval);
          setIsConnecting(false);
          // Refresh to show new accounts
          window.location.reload();
        }
      }, 1000);
    } catch (error) {
      console.error("Error connecting bank:", error);
      setError(error instanceof Error ? error.message : "Failed to connect bank account");
      setIsConnecting(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? "Connecting..." : "Connect Bank Account"}
      </button>
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}
