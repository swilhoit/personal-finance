"use client";

import { useEffect, useState, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";

const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function PlaidLinkButton() {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  useEffect(() => {
    if (DEMO) return; // skip fetching in demo mode
    const create = async () => {
      const res = await fetch("/api/plaid/create-link-token", { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      setLinkToken(data.link_token);
    };
    create();
  }, []);

  const onSuccess = useCallback(async (public_token: string) => {
    if (DEMO) return; // no-op in demo mode
    await fetch("/api/plaid/exchange-public-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_token }),
    });
  }, []);

  // Always call the hook; in demo pass a dummy token and a no-op to satisfy the API
  const { open, ready } = usePlaidLink({ token: (DEMO ? "demo" : (linkToken ?? "")), onSuccess });

  if (DEMO) {
    return (
      <div className="text-sm text-zinc-600 dark:text-zinc-400">
        Demo mode enabled: bank connection is disabled.
      </div>
    );
  }

  return (
    <button
      onClick={() => open()}
      disabled={!ready}
      className="rounded-md px-4 py-2 bg-black text-white dark:bg-white dark:text-black"
    >
      {ready ? "Connect a bank" : "Loading..."}
    </button>
  );
}
