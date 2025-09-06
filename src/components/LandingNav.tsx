"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const navItems = [
  { label: "Features", href: "#features", emoji: "✨" },
  { label: "How It Works", href: "#how-it-works", emoji: "🎮" },
  { label: "Pricing", href: "#pricing", emoji: "💎" },
  { label: "About", href: "#about", emoji: "🚀" },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <nav className={`fixed top-12 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled 
          ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-lg" 
          : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="group">
              <span className="font-dm-mono font-black text-3xl hover:scale-110 transition-transform inline-block text-white">
                MAMA
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="px-3 py-2 rounded-lg font-dm-mono font-medium text-sm transition-all hover:scale-105 text-white hover:bg-gray-100 uppercase"
                >
                  <span className="mr-1">{item.emoji}</span>
                  {item.label}
                </a>
              ))}
            </div>

            {/* Desktop Right Actions */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/auth/sign-in"
                className="px-4 py-2 rounded-lg font-dm-mono font-medium text-sm transition-all hover:scale-105 border-2 border-white text-white hover:bg-gray-100 uppercase"
              >
                Sign In
              </Link>
              <Link
                href="/auth/sign-up"
                className="px-4 py-2 bg-cyan-500 text-white rounded-lg font-dm-mono font-bold text-sm hover:scale-105 transition-all shadow-lg hover:shadow-cyan-500/50 uppercase"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              <svg 
                className={`w-6 h-6 ${scrolled ? "text-gray-700 dark:text-gray-300" : "text-white"}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-28 left-0 right-0 z-50 md:hidden animate-slideDown">
            <div className="mx-4 mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-cyan-400 dark:border-cyan-600 overflow-hidden">
              {/* Navigation Items */}
              <div className="p-4 space-y-2">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-all"
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="font-dm-mono font-medium text-gray-700 dark:text-gray-300">
                      {item.label}
                    </span>
                  </a>
                ))}
              </div>
              
              {/* Divider */}
              <div className="border-t-2 border-cyan-200 dark:border-cyan-800"></div>
              
              {/* Actions */}
              <div className="p-4 space-y-3">
                <Link
                  href="/auth/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center px-4 py-3 rounded-xl border-2 border-cyan-400 dark:border-cyan-600 text-cyan-700 dark:text-cyan-300 font-dm-mono font-medium hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/sign-up"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center px-4 py-3 rounded-xl bg-cyan-500 text-white font-dm-mono font-bold hover:scale-[1.02] transition-all shadow-lg"
                >
                  Get Started 🚀
                </Link>
              </div>
              
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </>
  );
}