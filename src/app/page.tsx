"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LandingNav from "@/components/LandingNav";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    // Check auth status client-side
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            router.push('/dashboard');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };
    checkAuth();
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Scrolling Marquee */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-500 py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap">
          <span className="font-dm-mono font-bold text-sm mx-8 text-white">YOUR PERSONAL FINANCE AGENT</span>
          <span className="font-dm-mono font-bold text-sm mx-8 text-white">•</span>
          <span className="font-dm-mono font-bold text-sm mx-8 text-white">AI-POWERED INSIGHTS</span>
          <span className="font-dm-mono font-bold text-sm mx-8 text-white">•</span>
          <span className="font-dm-mono font-bold text-sm mx-8 text-white">DISCORD NOTIFICATIONS</span>
          <span className="font-dm-mono font-bold text-sm mx-8 text-white">•</span>
          <span className="font-dm-mono font-bold text-sm mx-8 text-white">YOUR PERSONAL FINANCE AGENT</span>
          <span className="font-dm-mono font-bold text-sm mx-8 text-white">•</span>
          <span className="font-dm-mono font-bold text-sm mx-8 text-white">AI-POWERED INSIGHTS</span>
        </div>
      </div>

      {/* Landing Page Navigation */}
      <LandingNav />

      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-6xl mx-auto space-y-8 pt-20">
            {/* Circular Video */}
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 mx-auto mb-8">
              <div className="absolute inset-0 bg-emerald-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-[200%] h-[200%] object-cover translate-x-0 -translate-y-[25%]"
                >
                  <source src="/hero-video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="font-dm-mono text-emerald-400 text-sm font-medium">AI-Powered Financial Management</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-dm-mono font-bold tracking-tight leading-none text-white">
                Your Personal
                <br />
                <span className="text-emerald-400">Finance Agent</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-dm-mono leading-relaxed">
                Connect your accounts, get AI-powered insights, and receive intelligent alerts via Discord.
              </p>
              <div className="mt-6 max-w-2xl mx-auto">
                <p className="text-sm text-slate-500 leading-relaxed font-dm-mono">
                  We securely connect to your financial accounts through <span className="font-medium text-emerald-400">Teller</span>,
                  a trusted financial technology platform. Your data is encrypted and protected with bank-level security.
                  By using our service, you consent to Teller&apos;s secure processing of your financial information in accordance with their
                  <a href="https://teller.io/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline font-medium"> privacy policy</a>.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link
                href="/auth/sign-up"
                className="group relative px-8 py-4 bg-emerald-500 text-white rounded-xl font-dm-mono font-semibold text-base hover:bg-emerald-400 transition-all duration-300 shadow-lg shadow-emerald-500/25"
              >
                Get Started
              </Link>
              <Link
                href="/auth/sign-in"
                className="px-8 py-4 border border-white/20 text-white rounded-xl font-dm-mono font-medium text-base hover:bg-white/5 transition-all duration-300"
              >
                Sign In
              </Link>
            </div>

            {/* Scroll indicator */}
            <div className="pt-16 animate-bounce">
              <svg className="w-6 h-6 mx-auto text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-24 px-6 scroll-mt-20 bg-slate-900/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-dm-mono font-bold mb-4 text-white">
                Intelligent Financial Tools
              </h2>
              <p className="text-lg text-slate-400 font-dm-mono">
                Everything you need to manage your money smarter
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Privacy Feature */}
              <div
                className={`relative group cursor-pointer transform transition-all duration-300 ${
                  hoveredFeature === 0 ? 'scale-[1.02]' : ''
                }`}
                onMouseEnter={() => setHoveredFeature(0)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-emerald-500/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-dm-mono font-semibold mb-2 text-white">
                    Bank-Level Security
                  </h3>
                  <p className="text-slate-400 font-dm-mono text-sm leading-relaxed">
                    Your financial data is protected with 256-bit encryption through Teller&apos;s secure platform. We never store your banking credentials.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-slate-700/50 text-emerald-400 rounded-md text-xs font-dm-mono">
                      256-bit encryption
                    </span>
                    <span className="px-2 py-1 bg-slate-700/50 text-emerald-400 rounded-md text-xs font-dm-mono">
                      SOC 2 compliant
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Chat Feature */}
              <div
                className={`relative group cursor-pointer transform transition-all duration-300 ${
                  hoveredFeature === 1 ? 'scale-[1.02]' : ''
                }`}
                onMouseEnter={() => setHoveredFeature(1)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-emerald-500/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-dm-mono font-semibold mb-2 text-white">
                    AI Financial Advisor
                  </h3>
                  <p className="text-slate-400 font-dm-mono text-sm leading-relaxed">
                    Chat with your personal AI advisor. Get real-time guidance on spending, budgets, and financial decisions tailored to your data.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-slate-700/50 text-emerald-400 rounded-md text-xs font-dm-mono">
                      24/7 available
                    </span>
                    <span className="px-2 py-1 bg-slate-700/50 text-emerald-400 rounded-md text-xs font-dm-mono">
                      Personalized
                    </span>
                  </div>
                </div>
              </div>

              {/* Discord Feature */}
              <div
                className={`relative group cursor-pointer transform transition-all duration-300 ${
                  hoveredFeature === 2 ? 'scale-[1.02]' : ''
                }`}
                onMouseEnter={() => setHoveredFeature(2)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-emerald-500/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-dm-mono font-semibold mb-2 text-white">
                    Discord Notifications
                  </h3>
                  <p className="text-slate-400 font-dm-mono text-sm leading-relaxed">
                    Connect our Discord bot to receive smart alerts, weekly financial summaries, budget warnings, and market insights directly in your server.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-slate-700/50 text-emerald-400 rounded-md text-xs font-dm-mono">
                      Smart alerts
                    </span>
                    <span className="px-2 py-1 bg-slate-700/50 text-emerald-400 rounded-md text-xs font-dm-mono">
                      Weekly reports
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div id="how-it-works" className="py-24 px-6 scroll-mt-20 bg-slate-800/30">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="text-4xl font-dm-mono font-bold text-emerald-400 group-hover:scale-110 transition-transform">
                  100%
                </div>
                <div className="text-sm font-dm-mono text-slate-400 mt-2">
                  Private & Secure
                </div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-dm-mono font-bold text-emerald-400 group-hover:scale-110 transition-transform">
                  24/7
                </div>
                <div className="text-sm font-dm-mono text-slate-400 mt-2">
                  AI Assistant
                </div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-dm-mono font-bold text-emerald-400 group-hover:scale-110 transition-transform">
                  Real-time
                </div>
                <div className="text-sm font-dm-mono text-slate-400 mt-2">
                  Sync & Insights
                </div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-dm-mono font-bold text-emerald-400 group-hover:scale-110 transition-transform">
                  Free
                </div>
                <div className="text-sm font-dm-mono text-slate-400 mt-2">
                  To Get Started
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div id="pricing" className="py-24 px-6 scroll-mt-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-dm-mono font-bold mb-4 text-white">
              Simple Pricing
            </h2>
            <p className="text-lg text-slate-400 font-dm-mono mb-12">
              Start free, upgrade when you need more
            </p>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
              <div className="text-5xl font-dm-mono font-bold text-emerald-400 mb-4">
                Free
              </div>
              <p className="font-dm-mono text-slate-400">
                Forever • No credit card required
              </p>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div id="about" className="py-24 px-6 bg-slate-800/30 scroll-mt-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-dm-mono font-bold mb-4 text-white">
              About MAMA
            </h2>
            <p className="text-lg text-slate-400 font-dm-mono">
              Your personal AI-powered financial advisor, designed to help you make smarter money decisions.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-24 px-6 text-center scroll-mt-20">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl sm:text-4xl font-dm-mono font-bold text-white">
              Ready to take control?
            </h2>
            <p className="text-lg text-slate-400 font-dm-mono">
              Start managing your finances with AI-powered insights today.
            </p>
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white rounded-xl font-dm-mono font-semibold text-base hover:bg-emerald-400 transition-all duration-300 shadow-lg shadow-emerald-500/25"
            >
              <span>Get Started Free</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-700/50 p-8 bg-slate-900/50 backdrop-blur">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <p className="font-dm-mono text-slate-400 text-sm">
                Secure • Private • Intelligent
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
              <Link href="/legal/terms-of-service" className="hover:text-emerald-400 transition-colors">
                Terms of Service
              </Link>
              <Link href="/legal/privacy-policy" className="hover:text-emerald-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/legal/security" className="hover:text-emerald-400 transition-colors">
                Security & Data Protection
              </Link>
              <a href="https://teller.io/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                Teller Privacy Policy
              </a>
            </div>
            <div className="text-center mt-4 text-xs text-slate-600">
              <p>Financial data connections powered by Teller. Your data is encrypted and secure.</p>
            </div>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .animate-marquee {
          animation: marquee 25s linear infinite;
        }

        .delay-500 {
          animation-delay: 0.5s;
        }

        .delay-1000 {
          animation-delay: 1s;
        }

        .bg-grid-pattern {
          background-image:
            linear-gradient(rgba(16, 185, 129, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  );
}
