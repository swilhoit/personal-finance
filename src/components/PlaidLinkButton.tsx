"use client";

import { useEffect, useState, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";

const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function PlaidLinkButton() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (DEMO) return;
    const create = async () => {
      try {
        const res = await fetch("/api/plaid/create-link-token", { method: "POST" });
        if (!res.ok) {
          setError("Plaid is not configured. Using demo data.");
          return;
        }
        const data = await res.json();
        setLinkToken(data.link_token);
      } catch {
        setError("Plaid is not reachable. Using demo data.");
      }
    };
    create();
  }, []);

  const onSuccess = useCallback(async (public_token: string) => {
    if (DEMO) return;
    await fetch("/api/plaid/exchange-public-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_token }),
    });
  }, []);

  const { open, ready } = usePlaidLink({ token: (DEMO ? "demo" : (linkToken ?? "")), onSuccess });

  if (DEMO) {
    return <div className="text-sm text-zinc-600 dark:text-zinc-400">Demo mode: bank connection disabled.</div>;
  }

  if (error) {
    return <div className="text-sm text-amber-600">{error}</div>;
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
