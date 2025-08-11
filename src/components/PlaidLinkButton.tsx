"use client";

import { useEffect, useState, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";

export default function PlaidLinkButton() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const create = async () => {
      try {
        const res = await fetch("/api/plaid/create-link-token", { method: "POST" });
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || "Failed to initialize Plaid");
          setLoading(false);
          return;
        }
        
        setLinkToken(data.link_token);
        setLoading(false);
      } catch (err) {
        console.error("Error creating link token:", err);
        setError("Failed to connect to Plaid");
        setLoading(false);
      }
    };
    create();
  }, []);

  const onSuccess = useCallback(async (public_token: string) => {
    await fetch("/api/plaid/exchange-public-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_token }),
    });
    window.location.reload(); // Refresh to show new accounts
  }, []);

  const { open, ready } = usePlaidLink({ token: linkToken ?? "", onSuccess });

  // If Plaid is not configured, show a disabled button with helpful text
  if (error) {
    return (
      <button
        disabled
        className="rounded-md px-4 py-2 bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed"
        title={error}
      >
        {error.includes("not configured") ? "Plaid Not Configured" : "Connection Error"}
      </button>
    );
  }

  return (
    <button
      onClick={() => open()}
      disabled={!ready || loading}
      className="rounded-md px-4 py-2 bg-black text-white dark:bg-white dark:text-black disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Loading..." : ready ? "Connect a bank" : "Initializing..."}
    </button>
  );
}
