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

    // Mouse money eruption effect
    const handleMouseMove = (e: MouseEvent) => {
      if (Math.random() < 0.25) { // 25% chance on mouse move (more intense)
        createMoneyEmoji(e.clientX, e.clientY);
      }
    };

    const createMoneyEmoji = (x: number, y: number) => {
      // Create multiple emojis for more intensity
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const money = document.createElement('div');
          money.innerHTML = '💵'; // Dollar bill stack emoji
          money.style.cssText = `
            position: fixed;
            left: ${x + (Math.random() - 0.5) * 60}px;
            top: ${y + (Math.random() - 0.5) * 30}px;
            font-size: 36px;
            pointer-events: none;
            z-index: 9999;
            animation: moneyErupt 2.5s ease-out forwards;
          `;
          document.body.appendChild(money);
          
          setTimeout(() => {
            money.remove();
          }, 2500);
        }, i * 100);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-blue-500 dark:bg-blue-600 overflow-hidden" style={{backgroundColor: '#0066ff'}}>
      {/* Scrolling Marquee */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-400 py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap">
          <span className="font-dm-mono font-black text-lg mx-8 text-black uppercase">I ❤️ PERSONAL FINANCE</span>
          <span className="font-dm-mono font-black text-lg mx-8 text-black uppercase">I ❤️ PERSONAL FINANCE</span>
          <span className="font-dm-mono font-black text-lg mx-8 text-black uppercase">I ❤️ PERSONAL FINANCE</span>
          <span className="font-dm-mono font-black text-lg mx-8 text-black uppercase">I ❤️ PERSONAL FINANCE</span>
          <span className="font-dm-mono font-black text-lg mx-8 text-black uppercase">I ❤️ PERSONAL FINANCE</span>
          <span className="font-dm-mono font-black text-lg mx-8 text-black uppercase">I ❤️ PERSONAL FINANCE</span>
          <span className="font-dm-mono font-black text-lg mx-8 text-black uppercase">I ❤️ PERSONAL FINANCE</span>
          <span className="font-dm-mono font-black text-lg mx-8 text-black uppercase">I ❤️ PERSONAL FINANCE</span>
        </div>
      </div>
      
      {/* Landing Page Navigation */}
      <LandingNav />
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400/20 dark:bg-yellow-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400/20 dark:bg-yellow-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-400/10 dark:bg-yellow-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-30 dark:opacity-10"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-6xl mx-auto space-y-8 pt-20">
            {/* Circular Video */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 mx-auto mb-8">
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-cyan-400/50 dark:border-cyan-600/50 shadow-2xl">
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

            {/* Animated badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-900/80 rounded-full border-2 border-cyan-400 dark:border-cyan-600 animate-bounce-slow backdrop-blur-sm">
              <span className="text-2xl">🚀</span>
              <span className="font-dm-mono text-cyan-700 dark:text-cyan-300 text-sm font-bold">LEVEL UP YOUR FINANCES</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-dm-mono font-black tracking-tight leading-none text-yellow-400">
                <span>
                  MONEY MADE
                </span>
                <br />
                <span>
                  AWESOME!
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto font-dm-mono font-medium leading-relaxed">
                Your AI financial advisor that gamifies budgeting 🎮
              </p>
              <div className="mt-6 max-w-3xl mx-auto">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-dm-mono">
                  We securely connect to your financial accounts through <span className="font-bold text-cyan-600 dark:text-cyan-400">Teller</span>, 
                  a trusted financial technology platform. Your data is encrypted and protected with bank-level security. 
                  By using our service, you consent to Teller&apos;s secure processing of your financial information in accordance with their 
                  <a href="https://teller.io/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-600 dark:text-cyan-400 hover:underline font-bold"> privacy policy</a>.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <Link
                href="/auth/sign-up"
                className="group relative px-10 py-5 bg-cyan-500 text-white rounded-2xl font-dm-mono font-bold text-lg hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-cyan-500/50 overflow-hidden"
              >
                <span className="relative z-10">START QUEST 🎮</span>
                <div className="absolute inset-0 bg-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link
                href="/auth/sign-in"
                className="px-10 py-5 border-3 border-cyan-500 dark:border-cyan-400 text-cyan-700 dark:text-cyan-300 rounded-2xl font-dm-mono font-bold text-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/30 hover:scale-105 transition-all duration-300"
              >
                CONTINUE →
              </Link>
            </div>

            {/* Scroll indicator */}
            <div className="pt-16 animate-bounce">
              <svg className="w-8 h-8 mx-auto text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-24 px-6 scroll-mt-20 bg-blue-500" style={{backgroundColor: '#0066ff'}}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-dm-mono font-black mb-4 bg-cyan-500 ">
                POWER-UPS UNLOCKED
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 font-dm-mono font-medium">
                Your financial superpowers await 💪
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Privacy Feature */}
              <div
                className={`relative group cursor-pointer transform transition-all duration-500 ${
                  hoveredFeature === 0 ? 'scale-105 -rotate-2' : ''
                }`}
                onMouseEnter={() => setHoveredFeature(0)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className="absolute inset-0 bg-cyan-400 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-8 border-4 border-cyan-400 dark:border-cyan-600 shadow-2xl">
                  <div className="text-6xl mb-6 animate-wiggle">🔐</div>
                  <h3 className="text-2xl font-dm-mono font-black mb-4 text-cyan-600 dark:text-teal-600">
                    STEALTH MODE
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 font-dm-mono font-medium leading-relaxed">
                    Your financial data is protected with bank-level encryption through Teller&apos;s secure platform. We never store your banking credentials - complete privacy protection for your financial quest!
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-cyan-600 dark:text-teal-600 rounded-full text-sm font-dm-mono font-bold">
                      256-BIT 🔒
                    </span>
                    <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-cyan-600 dark:text-teal-600 rounded-full text-sm font-dm-mono font-bold">
                      BANK SECURE ✨
                    </span>
                  </div>
                </div>
              </div>

              {/* Video Chat Feature */}
              <div
                className={`relative group cursor-pointer transform transition-all duration-500 ${
                  hoveredFeature === 1 ? 'scale-105 rotate-2' : ''
                }`}
                onMouseEnter={() => setHoveredFeature(1)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className="absolute inset-0 bg-teal-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-8 border-4 border-teal-600 dark:border-cyan-500 shadow-2xl">
                  <div className="text-6xl mb-6 animate-wiggle delay-100">📹</div>
                  <h3 className="text-2xl font-dm-mono font-black mb-4 text-teal-600 dark:text-cyan-500">
                    AI CO-OP MODE
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 font-dm-mono font-medium leading-relaxed">
                    Video chat with your personal AI financial advisor. Get real-time guidance and epic strategies face-to-face!
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-teal-600 dark:text-cyan-500 rounded-full text-sm font-dm-mono font-bold">
                      24/7 🔥
                    </span>
                    <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-teal-600 dark:text-cyan-500 rounded-full text-sm font-dm-mono font-bold">
                      LIVE CHAT 🎮
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Training Feature */}
              <div
                className={`relative group cursor-pointer transform transition-all duration-500 ${
                  hoveredFeature === 2 ? 'scale-105 -rotate-2' : ''
                }`}
                onMouseEnter={() => setHoveredFeature(2)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className="absolute inset-0 bg-teal-500 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-8 border-4 border-teal-500 dark:border-teal-500 shadow-2xl">
                  <div className="text-6xl mb-6 animate-wiggle delay-200">🧠</div>
                  <h3 className="text-2xl font-dm-mono font-black mb-4 text-teal-500 dark:text-teal-500">
                    SMART AI BRAIN
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 font-dm-mono font-medium leading-relaxed">
                    AI trained on YOUR data to create personalized strategies and epic game plans for financial victory! 🏆
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-teal-500 dark:text-teal-500 rounded-full text-sm font-dm-mono font-bold">
                      CUSTOM AI 🤖
                    </span>
                    <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-teal-500 dark:text-teal-500 rounded-full text-sm font-dm-mono font-bold">
                      ADAPTIVE 🚀
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="py-24 px-6 bg-yellow-200/30 dark:bg-yellow-700/30 scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="text-5xl font-dm-mono font-black text-cyan-600 dark:text-teal-600 group-hover:scale-110 transition-transform">
                  100%
                </div>
                <div className="text-lg font-dm-mono font-bold text-gray-600 dark:text-gray-400 mt-2">
                  PRIVATE
                </div>
              </div>
              <div className="text-center group">
                <div className="text-5xl font-dm-mono font-black text-teal-600 dark:text-cyan-500 group-hover:scale-110 transition-transform">
                  24/7
                </div>
                <div className="text-lg font-dm-mono font-bold text-gray-600 dark:text-gray-400 mt-2">
                  AI ADVISOR
                </div>
              </div>
              <div className="text-center group">
                <div className="text-5xl font-dm-mono font-black text-teal-500 dark:text-teal-500 group-hover:scale-110 transition-transform">
                  ∞
                </div>
                <div className="text-lg font-dm-mono font-bold text-gray-600 dark:text-gray-400 mt-2">
                  INSIGHTS
                </div>
              </div>
              <div className="text-center group">
                <div className="text-5xl font-dm-mono font-black text-cyan-600 dark:text-teal-600 group-hover:scale-110 transition-transform">
                  1UP
                </div>
                <div className="text-lg font-dm-mono font-bold text-gray-600 dark:text-gray-400 mt-2">
                  YOUR MONEY
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div id="pricing" className="py-24 px-6 scroll-mt-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-dm-mono font-black mb-4 text-cyan-600 ">
              SIMPLE PRICING
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-dm-mono font-medium mb-12">
              Start free, upgrade when ready
            </p>
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-3xl border-4 border-cyan-600 dark:border-teal-600 p-8 shadow-2xl">
              <div className="text-6xl font-dm-mono font-black text-cyan-600  mb-4">
                FREE
              </div>
              <p className="font-dm-mono font-medium text-gray-600 dark:text-gray-400">
                Forever • No credit card required
              </p>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div id="about" className="py-24 px-6 bg-yellow-200/30 dark:bg-yellow-700/30 scroll-mt-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-dm-mono font-black mb-4 text-cyan-600 ">
              ABOUT MAMA
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-dm-mono font-medium">
              Your personal AI-powered financial advisor 🤖
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-24 px-6 text-center scroll-mt-20">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-4xl sm:text-5xl font-dm-mono font-black text-cyan-600 ">
              READY PLAYER ONE?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-dm-mono font-medium">
              Join thousands leveling up their financial game 🎮
            </p>
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center gap-3 px-12 py-6 text-cyan-600 text-white rounded-3xl font-dm-mono font-bold text-xl hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-cyan-600/50 group"
            >
              <span>PLAY NOW</span>
              <span className="text-2xl group-hover:translate-x-2 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t-4 border-cyan-300 dark:border-cyan-700 p-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <p className="font-['Rubik_Mono_One'] text-cyan-700 dark:text-cyan-300">
                🎮 SECURE • 🔐 PRIVATE • 🚀 POWERFUL
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <Link href="/legal/terms-of-service" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                Terms of Service
              </Link>
              <Link href="/legal/privacy-policy" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/legal/security" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                Security & Data Protection
              </Link>
              <a href="https://teller.io/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                Teller Privacy Policy
              </a>
            </div>
            <div className="text-center mt-4 text-xs text-gray-500 dark:text-gray-500">
              <p>Financial data connections powered by Teller. Your data is encrypted and secure.</p>
            </div>
          </div>
        </footer>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-30px) rotate(10deg);
          }
        }

        @keyframes wiggle {
          0%, 100% {
            transform: rotate(-3deg);
          }
          50% {
            transform: rotate(3deg);
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-wiggle {
          animation: wiggle 2s ease-in-out infinite;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animate-bounce-slow {
          animation: bounce 3s ease-in-out infinite;
        }

        .delay-100 {
          animation-delay: 0.1s;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }

        .delay-500 {
          animation-delay: 0.5s;
        }

        .delay-1000 {
          animation-delay: 1s;
        }

        .bg-grid-pattern {
          background-image: 
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        @keyframes moneyErupt {
          0% {
            transform: translateY(0) rotate(0deg) scale(0.5);
            opacity: 1;
          }
          50% {
            transform: translateY(-50px) rotate(180deg) scale(1);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-100px) rotate(360deg) scale(0);
            opacity: 0;
          }
        }

        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
}