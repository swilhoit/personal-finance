"use client";

import { useState } from "react";

export default function TellerConnect() {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Create Teller enrollment
      const response = await fetch("/api/teller/create-enrollment", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create enrollment");
      }

      const { enrollment_url } = await response.json();

      // Open Teller Connect in popup
      const width = 500;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        enrollment_url,
        "TellerConnect",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Poll for completion
      const checkInterval = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkInterval);
          setIsConnecting(false);
          window.location.reload();
        }
      }, 1000);
    } catch (error) {
      console.error("Error connecting bank:", error);
      setIsConnecting(false);
    }
  };

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isConnecting ? "Connecting..." : "Connect Bank Account"}
    </button>
  );
}
