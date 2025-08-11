"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";

interface UserMenuProps {
  userEmail?: string;
}

export default function UserMenu({ userEmail }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseClient();

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
          {userEmail?.[0]?.toUpperCase() || "U"}
        </div>
        <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800 z-20">
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <p className="text-sm font-medium truncate">{userEmail}</p>
            </div>
            <div className="py-1">
              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full text-left px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {loading ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}