"use client";

import { useEffect, useState, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";

export default function PlaidLinkButton() {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  useEffect(() => {
    const create = async () => {
      const res = await fetch("/api/plaid/create-link-token", { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      setLinkToken(data.link_token);
    };
    create();
  }, []);

  const onSuccess = useCallback(async (public_token: string) => {
    await fetch("/api/plaid/exchange-public-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_token }),
    });
  }, []);

  const { open, ready } = usePlaidLink({ token: linkToken ?? "", onSuccess });

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
