"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
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
      <nav className={`fixed top-10 left-0 right-0 z-[100] transition-all duration-300 ${
        scrolled
          ? "bg-slate-900/90 backdrop-blur-lg shadow-lg border-b border-slate-700/50"
          : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="group">
              <span className="font-dm-mono font-bold text-2xl hover:text-emerald-400 transition-colors text-white">
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
                  className="px-4 py-2 rounded-lg font-dm-mono font-medium text-sm transition-all hover:bg-white/5 text-slate-300 hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Desktop Right Actions */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/auth/sign-in"
                className="px-4 py-2 rounded-lg font-dm-mono font-medium text-sm transition-all text-slate-300 hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/auth/sign-up"
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-dm-mono font-semibold text-sm hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
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
                className="w-6 h-6 text-white"
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed top-28 left-0 right-0 z-[150] md:hidden animate-slideDown">
            <div className="mx-4 mt-2 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
              {/* Navigation Items */}
              <div className="p-4 space-y-1">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="flex items-center px-4 py-3 rounded-xl hover:bg-slate-700/50 transition-all"
                  >
                    <span className="font-dm-mono font-medium text-slate-200">
                      {item.label}
                    </span>
                  </a>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-slate-700/50"></div>

              {/* Actions */}
              <div className="p-4 space-y-3">
                <Link
                  href="/auth/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center px-4 py-3 rounded-xl border border-slate-600 text-slate-200 font-dm-mono font-medium hover:bg-slate-700/50 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/sign-up"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center px-4 py-3 rounded-xl bg-emerald-500 text-white font-dm-mono font-semibold hover:bg-emerald-400 transition-all shadow-lg"
                >
                  Get Started
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
