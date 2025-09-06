"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user?.identities?.length === 0) {
        setError("An account with this email already exists");
        return;
      }

      setSuccess(true);
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!signInError) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setError((error as Error).message || "An error occurred during sign up");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-teal-50 dark:from-gray-900 dark:via-cyan-950 dark:to-teal-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="text-8xl mb-4 animate-bounce">🎉</div>
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border-4 border-green-400 dark:border-green-600 px-8 py-6 rounded-3xl">
            <h3 className="font-['Bungee'] text-2xl text-green-600 dark:text-green-400 mb-2">
              LEVEL UP!
            </h3>
            <p className="font-['Rubik_Mono_One'] text-sm text-gray-600 dark:text-gray-400">
              ACCOUNT CREATED SUCCESSFULLY
            </p>
            <div className="mt-4 flex justify-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-teal-50 dark:from-gray-900 dark:via-cyan-950 dark:to-teal-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-300/20 dark:bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-300/20 dark:bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
      </div>

      <div className="relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl shadow-2xl mb-4 transform hover:scale-110 transition-transform">
            <span className="text-5xl font-['Bungee'] text-white">M</span>
          </div>
          <h1 className="text-4xl font-['Bungee'] bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
            NEW PLAYER
          </h1>
          <p className="font-['Rubik_Mono_One'] text-sm text-gray-600 dark:text-gray-400 mt-2">
            START YOUR FINANCIAL QUEST
          </p>
        </div>

        {/* Sign up form */}
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-3xl border-4 border-cyan-400 dark:border-cyan-600 p-8 max-w-md w-full shadow-2xl">
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="font-['Rubik_Mono_One'] text-sm text-cyan-700 dark:text-cyan-300 block mb-2">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border-2 border-cyan-400 dark:border-cyan-600 px-4 py-3 bg-white dark:bg-gray-900 font-['Rubik_Mono_One'] text-sm focus:outline-none focus:ring-4 focus:ring-cyan-300 dark:focus:ring-cyan-700 transition-all"
                placeholder="newplayer@example.com"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="font-['Rubik_Mono_One'] text-sm text-cyan-700 dark:text-cyan-300 block mb-2">
                CREATE PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border-2 border-cyan-400 dark:border-cyan-600 px-4 py-3 bg-white dark:bg-gray-900 font-['Rubik_Mono_One'] text-sm focus:outline-none focus:ring-4 focus:ring-cyan-300 dark:focus:ring-cyan-700 transition-all"
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <p className="mt-1 text-xs font-['Rubik_Mono_One'] text-gray-500 dark:text-gray-500 flex items-center gap-1">
                <span>⚡</span> MIN 6 CHARACTERS
              </p>
            </div>

            <div>
              <label className="font-['Rubik_Mono_One'] text-sm text-cyan-700 dark:text-cyan-300 block mb-2">
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border-2 border-cyan-400 dark:border-cyan-600 px-4 py-3 bg-white dark:bg-gray-900 font-['Rubik_Mono_One'] text-sm focus:outline-none focus:ring-4 focus:ring-cyan-300 dark:focus:ring-cyan-700 transition-all"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-100 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600 rounded-xl">
                <span className="text-xl">⚠️</span>
                <span className="font-['Rubik_Mono_One'] text-xs text-red-600 dark:text-red-400">{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-6 py-4 font-['Rubik_Mono_One'] text-lg hover:scale-105 transition-all shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⚙️</span>
                  <span>CREATING...</span>
                </>
              ) : (
                <>
                  <span>CREATE ACCOUNT</span>
                  <span>🚀</span>
                </>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-cyan-300 dark:border-cyan-700"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white dark:bg-gray-900 font-['Rubik_Mono_One'] text-xs text-gray-500">OR</span>
            </div>
          </div>

          <button
            onClick={async () => {
              setLoading(true);
              await supabase.auth.signInWithOAuth({ provider: "google" });
            }}
            disabled={loading}
            className="w-full rounded-xl border-2 border-cyan-400 dark:border-cyan-600 px-6 py-4 font-['Rubik_Mono_One'] hover:bg-cyan-100 dark:hover:bg-cyan-900/30 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <span className="text-2xl">🔷</span>
            <span>SIGN UP WITH GOOGLE</span>
          </button>

          <div className="mt-6 text-center">
            <p className="font-['Rubik_Mono_One'] text-xs text-gray-600 dark:text-gray-400">
              ALREADY A PLAYER?{" "}
              <Link href="/auth/sign-in" className="text-cyan-600 dark:text-cyan-400 hover:underline">
                SIGN IN
              </Link>
            </p>
          </div>
        </div>

        {/* Fun footer */}
        <div className="text-center mt-8">
          <p className="font-['Rubik_Mono_One'] text-xs text-gray-500 dark:text-gray-500">
            🎮 FREE TO PLAY • 🏆 NO PAY TO WIN • 🚀 START NOW
          </p>
        </div>
      </div>

      <style jsx>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}