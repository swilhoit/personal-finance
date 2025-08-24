"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "./UserMenu";
import NotificationCenter from "./NotificationCenter";
import ThemeToggle from "./ThemeToggle";

const navigation = [
  { name: "Dashboard", href: "/dashboard", emoji: "🏠", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { name: "Transactions", href: "/transactions", emoji: "💸", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { name: "Insights", href: "/insights", emoji: "📊", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { name: "Accounts", href: "/accounts", emoji: "🏦", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { name: "Settings", href: "/settings", emoji: "⚙️", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

interface AppHeaderProps {
  userEmail?: string | null;
}

export default function AppHeader({ userEmail }: AppHeaderProps) {
  const pathname = usePathname();

  // Don't show header on auth pages or landing page
  if (pathname === "/" || pathname?.startsWith("/auth")) {
    return null;
  }

  // Get current page name for mobile
  const currentPage = navigation.find(item => 
    pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href))
  ) || navigation[0];

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden bg-gradient-to-r from-cyan-500 to-teal-500 sticky top-0 z-40 shadow-lg">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and Current Page */}
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-white/30 rounded-xl blur-lg group-hover:blur-xl transition-all"></div>
                <div className="relative w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-['Bungee'] text-lg shadow-lg transform group-hover:scale-110 transition-transform">
                  M
                </div>
              </div>
              <div>
                <h1 className="font-['Rubik_Mono_One'] text-white text-base">{currentPage.name}</h1>
                <p className="text-xs text-white/80 font-['Rubik_Mono_One']">MAMA</p>
              </div>
            </div>
            
            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <div className="bg-white/20 backdrop-blur-sm rounded-lg">
                <NotificationCenter />
              </div>
              {userEmail && (
                <div className="bg-white/20 backdrop-blur-sm rounded-lg">
                  <UserMenu userEmail={userEmail} />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:block bg-gradient-to-r from-cyan-500 via-sky-500 to-teal-500 shadow-2xl relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            {[
              { left: '5%', top: '10%', delay: '0s', emoji: '💰' },
              { left: '15%', top: '60%', delay: '0.5s', emoji: '🎮' },
              { left: '25%', top: '30%', delay: '1s', emoji: '📊' },
              { left: '35%', top: '70%', delay: '1.5s', emoji: '🚀' },
              { left: '45%', top: '20%', delay: '2s', emoji: '💎' },
              { left: '55%', top: '80%', delay: '2.5s', emoji: '🏆' },
              { left: '65%', top: '40%', delay: '3s', emoji: '💰' },
              { left: '75%', top: '15%', delay: '3.5s', emoji: '🎮' },
              { left: '85%', top: '55%', delay: '4s', emoji: '📊' },
              { left: '95%', top: '25%', delay: '4.5s', emoji: '🚀' },
              { left: '10%', top: '85%', delay: '1.2s', emoji: '💎' },
              { left: '20%', top: '45%', delay: '2.2s', emoji: '🏆' },
              { left: '30%', top: '5%', delay: '3.2s', emoji: '💰' },
              { left: '40%', top: '90%', delay: '0.2s', emoji: '🎮' },
              { left: '50%', top: '50%', delay: '1.7s', emoji: '📊' },
              { left: '60%', top: '65%', delay: '2.7s', emoji: '🚀' },
              { left: '70%', top: '35%', delay: '3.7s', emoji: '💎' },
              { left: '80%', top: '75%', delay: '0.7s', emoji: '🏆' },
              { left: '90%', top: '8%', delay: '1.3s', emoji: '💰' },
              { left: '12%', top: '95%', delay: '2.3s', emoji: '🎮' },
            ].map((item, i) => (
              <div
                key={i}
                className="absolute animate-float text-3xl opacity-30"
                style={{
                  left: item.left,
                  top: item.top,
                  animationDelay: item.delay,
                }}
              >
                {item.emoji}
              </div>
            ))}
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link href="/dashboard" className="group">
                <span className="font-['Bungee'] text-3xl text-white drop-shadow-lg hover:scale-110 transition-transform inline-block">MAMA</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="flex items-center gap-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg font-['Rubik_Mono_One'] text-xs transition-all transform hover:scale-105 ${
                      isActive
                        ? "bg-white/30 backdrop-blur-sm text-white shadow-lg scale-105"
                        : "bg-white/10 backdrop-blur-sm text-white/90 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-orange-500/30 rounded-xl blur animate-pulse"></div>
                    )}
                    <span className="relative text-lg">{item.emoji}</span>
                    <span className="relative text-xs">{item.name.toUpperCase()}</span>
                    {isActive && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="relative bg-white/20 backdrop-blur-sm rounded-xl">
                <NotificationCenter />
              </div>
              {userEmail && (
                <div className="bg-white/20 backdrop-blur-sm rounded-xl">
                  <UserMenu userEmail={userEmail} />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}