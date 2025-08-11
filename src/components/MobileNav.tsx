"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "Home" },
  { href: "/transactions", label: "Transactions" },
  { href: "/insights", label: "Insights" },
  { href: "/accounts", label: "Accounts" },
  { href: "/settings", label: "Settings" },
];

export default function MobileNav() {
  const pathname = usePathname();
  if (pathname?.startsWith("/auth")) return null;

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 shadow-lg rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/90 backdrop-blur px-2 py-1 flex gap-1">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-3 py-2 rounded-full text-sm ${active ? "bg-black text-white dark:bg-white dark:text-black" : "text-zinc-700 dark:text-zinc-300"}`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
