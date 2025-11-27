"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";

export default function MobileNav() {
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState(0);

  const navItems = useMemo(() => [
    {
      href: "/dashboard",
      label: "HOME",
      emoji: "🏠",
      color: "from-cyan-400 to-cyan-600",
    },
    {
      href: "/transactions",
      label: "TRANS",
      emoji: "💸",
      color: "from-green-400 to-green-600",
    },
    {
      href: "/investments",
      label: "INVEST",
      emoji: "📈",
      color: "from-indigo-400 to-purple-600",
    },
    {
      href: "/insights",
      label: "STATS",
      emoji: "📊",
      color: "from-purple-400 to-purple-600",
    },
    {
      href: "/settings",
      label: "MORE",
      emoji: "⚙️",
      color: "from-gray-400 to-gray-600",
    }
  ], []);

  useEffect(() => {
    const currentIndex = navItems.findIndex(item =>
      pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href))
    );
    if (currentIndex !== -1) setActiveIndex(currentIndex);
  }, [pathname, navItems]);

  // Don't show nav on auth pages or landing page
  if (pathname === "/" || pathname?.startsWith("/auth")) return null;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-cyan-500 via-sky-500 to-teal-500 lg:hidden z-50 pb-safe shadow-2xl">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>

        <div className="relative grid grid-cols-5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center py-3 transition-all transform ${
                  isActive ? "scale-110 -translate-y-1" : "hover:scale-105"
                }`}
              >
                {isActive && (
                  <>
                    {/* Active indicator */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50"></div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-white/20 blur-xl"></div>
                  </>
                )}
                
                <div className={`relative transition-all ${isActive ? "animate-bounce-slow" : ""}`}>
                  <span className="text-2xl filter drop-shadow-lg">{item.emoji}</span>
                  {isActive && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                    </span>
                  )}
                </div>
                
                <span className={`text-[10px] mt-1 font-['Rubik_Mono_One'] ${
                  isActive ? "text-white font-bold" : "text-white/80"
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Sliding indicator */}
        <div 
          className="absolute bottom-0 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-300 shadow-lg"
          style={{
            width: `${100 / navItems.length}%`,
            left: `${(activeIndex * 100) / navItems.length}%`,
          }}
        />
      </nav>

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}