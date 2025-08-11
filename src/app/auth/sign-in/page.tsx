"use client";

export default function SignInPage() {
  async function signInWithGoogle() {
    const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({ provider: "google" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="border rounded-xl p-8 max-w-sm w-full space-y-4">
        <h1 className="text-xl font-semibold">Sign In</h1>
        <button
          onClick={signInWithGoogle}
          className="w-full rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2"
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
