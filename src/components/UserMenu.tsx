"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Handle Escape key to close dropdown
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/20 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-yellow-400 text-gray-900 flex items-center justify-center text-sm font-medium">
          {userEmail?.[0]?.toUpperCase() || "U"}
        </div>
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[150]"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-[200]"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="user-menu-button"
          >
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-medium truncate text-gray-900">{userEmail}</p>
            </div>
            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/accounts');
                }}
                role="menuitem"
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Accounts
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/import');
                }}
                role="menuitem"
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Import Transactions
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/settings');
                }}
                role="menuitem"
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Settings
              </button>
              <div className="border-t border-gray-200 my-1" />
              <button
                onClick={handleSignOut}
                disabled={loading}
                role="menuitem"
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
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