"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({ provider: "google" });
  }

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="border rounded-xl p-8 max-w-sm w-full space-y-6">
        <h1 className="text-xl font-semibold">Sign In</h1>

        <form onSubmit={signInWithPassword} className="space-y-3">
          <div>
            <label className="text-sm block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="text-sm block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="********"
              required
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button type="submit" className="w-full rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2">
            Continue
          </button>
        </form>

        <div className="text-center text-xs text-zinc-500">or</div>

        <button
          onClick={signInWithGoogle}
          className="w-full rounded-md border px-4 py-2"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}