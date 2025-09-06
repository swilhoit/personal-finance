"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LandingNav from "@/components/LandingNav";

export default function AILanding() {
  const [mounted, setMounted] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    
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
  }, []);

  if (!mounted) return null;

  return (
    <div className="light min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-teal-50 overflow-hidden">
      {/* Landing Page Navigation */}
      <LandingNav />
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-300/20 dark:bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-300/20 dark:bg-teal-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-300/10 dark:bg-sky-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern opacity-20"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-6xl mx-auto space-y-8 pt-20">
            {/* Circular Video */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 mx-auto mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-teal-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-cyan-400/50 dark:border-cyan-600/50 shadow-2xl bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-900 dark:to-teal-900 flex items-center justify-center">
                <div className="text-8xl animate-wiggle">🤖</div>
              </div>
            </div>

            {/* Animated badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 dark:bg-cyan-900/50 rounded-full border-2 border-cyan-300 dark:border-cyan-700 animate-bounce-slow">
              <span className="text-2xl">🚀</span>
              <span className="font-['Rubik_Mono_One'] text-cyan-700 dark:text-cyan-300 text-sm">NEXT-GEN AI AVATARS</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-['Oranienbaum'] tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent animate-gradient">
                  AI AVATARS
                </span>
                <br />
                <span className="bg-gradient-to-r from-teal-500 to-sky-500 bg-clip-text text-transparent animate-gradient delay-200">
                  FOR BRANDS
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto font-['Rubik_Mono_One'] leading-relaxed">
                Interactive AI characters that speak, engage, and represent your brand with voice-powered animated chat experiences 🎮
              </p>
              <div className="mt-6 max-w-4xl mx-auto">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Transform customer engagement with AI avatars that embody your brand personality. Our interactive characters provide 
                  <span className="font-semibold text-cyan-600 dark:text-cyan-400"> real-time voice conversations</span>, 
                  dynamic animations, and personalized experiences that convert visitors into loyal customers.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <Link
                href="/ai/demo"
                className="group relative px-10 py-5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-2xl font-['Rubik_Mono_One'] text-lg hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-cyan-500/50 overflow-hidden"
              >
                <span className="relative z-10">TRY DEMO 🤖</span>
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <Link
                href="/ai/pricing"
                className="px-10 py-5 border-3 border-cyan-500 dark:border-cyan-400 text-cyan-700 dark:text-cyan-300 rounded-2xl font-['Rubik_Mono_One'] text-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/30 hover:scale-105 transition-all duration-300"
              >
                VIEW PRICING →
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

        {/* Services Section */}
        <div id="services" className="py-24 px-6 scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-['Oranienbaum'] mb-4 bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
                AI AVATAR SERVICES
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 font-['Rubik_Mono_One']">
                Complete solutions for interactive brand experiences 🎯
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Voice-Powered Chat */}
              <div
                className={`relative group cursor-pointer transform transition-all duration-500 ${
                  hoveredFeature === 0 ? 'scale-105 -rotate-2' : ''
                }`}
                onMouseEnter={() => setHoveredFeature(0)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-teal-400 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-8 border-4 border-cyan-400 dark:border-cyan-600 shadow-2xl">
                  <div className="text-6xl mb-6 animate-wiggle">🎤</div>
                  <h3 className="text-2xl font-['Oranienbaum'] mb-4 text-cyan-600 dark:text-cyan-400">
                    VOICE CHAT
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                    Real-time voice conversations with lifelike AI avatars that understand context, emotion, and brand personality for authentic customer interactions.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 rounded-full text-sm font-['Rubik_Mono_One']">
                      REAL-TIME 🔊
                    </span>
                    <span className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 rounded-full text-sm font-['Rubik_Mono_One']">
                      MULTILINGUAL 🌍
                    </span>
                  </div>
                </div>
              </div>

              {/* Animated Characters */}
              <div
                className={`relative group cursor-pointer transform transition-all duration-500 ${
                  hoveredFeature === 1 ? 'scale-105 rotate-2' : ''
                }`}
                onMouseEnter={() => setHoveredFeature(1)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-cyan-400 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-8 border-4 border-sky-400 dark:border-sky-600 shadow-2xl">
                  <div className="text-6xl mb-6 animate-wiggle delay-100">🎭</div>
                  <h3 className="text-2xl font-['Oranienbaum'] mb-4 text-sky-600 dark:text-sky-400">
                    ANIMATED AVATARS
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                    Custom-designed 3D animated characters that embody your brand identity with expressive facial animations and gestures.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 rounded-full text-sm font-['Rubik_Mono_One']">
                      3D MODELS ✨
                    </span>
                    <span className="px-3 py-1 bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 rounded-full text-sm font-['Rubik_Mono_One']">
                      CUSTOM DESIGN 🎨
                    </span>
                  </div>
                </div>
              </div>

              {/* Brand Integration */}
              <div
                className={`relative group cursor-pointer transform transition-all duration-500 ${
                  hoveredFeature === 2 ? 'scale-105 -rotate-2' : ''
                }`}
                onMouseEnter={() => setHoveredFeature(2)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-8 border-4 border-teal-400 dark:border-teal-600 shadow-2xl">
                  <div className="text-6xl mb-6 animate-wiggle delay-200">🎯</div>
                  <h3 className="text-2xl font-['Oranienbaum'] mb-4 text-teal-600 dark:text-teal-400">
                    BRAND INTEGRATION
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                    Seamlessly integrate AI avatars into your website, apps, or digital platforms with custom branding and personality training.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 rounded-full text-sm font-['Rubik_Mono_One']">
                      API READY 🔗
                    </span>
                    <span className="px-3 py-1 bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 rounded-full text-sm font-['Rubik_Mono_One']">
                      BRANDED 🏷️
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Use Cases Section */}
        <div id="use-cases" className="py-24 px-6 bg-gradient-to-r from-cyan-100/50 to-teal-100/50 dark:from-cyan-900/20 dark:to-teal-900/20 scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-['Oranienbaum'] mb-4 bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
                PERFECT FOR
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 font-['Rubik_Mono_One']">
                Industries revolutionizing customer engagement 🚀
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🏪</div>
                <div className="text-lg font-['Oranienbaum'] text-cyan-600 dark:text-cyan-400 mb-2">
                  E-COMMERCE
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-['Rubik_Mono_One']">
                  Virtual sales assistants that guide customers through purchases
                </div>
              </div>
              <div className="text-center group">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🏥</div>
                <div className="text-lg font-['Oranienbaum'] text-sky-600 dark:text-sky-400 mb-2">
                  HEALTHCARE
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-['Rubik_Mono_One']">
                  Patient support avatars for appointment scheduling and info
                </div>
              </div>
              <div className="text-center group">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🎓</div>
                <div className="text-lg font-['Oranienbaum'] text-teal-600 dark:text-teal-400 mb-2">
                  EDUCATION
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-['Rubik_Mono_One']">
                  Interactive tutors and learning companions for students
                </div>
              </div>
              <div className="text-center group">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">💼</div>
                <div className="text-lg font-['Oranienbaum'] text-cyan-600 dark:text-cyan-400 mb-2">
                  ENTERPRISE
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-['Rubik_Mono_One']">
                  Corporate training and internal support systems
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-24 px-6 scroll-mt-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-['Oranienbaum'] mb-4 bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
                POWERFUL FEATURES
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 font-['Rubik_Mono_One']">
                Everything you need for engaging AI experiences 💎
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: "🧠", title: "AI PERSONALITY", desc: "Custom-trained AI with your brand's unique voice and personality" },
                { icon: "🎨", title: "VISUAL DESIGN", desc: "Stunning 3D avatars designed to match your brand aesthetic" },
                { icon: "📱", title: "MULTI-PLATFORM", desc: "Deploy on websites, mobile apps, kiosks, and more" },
                { icon: "📊", title: "ANALYTICS", desc: "Detailed insights on user interactions and engagement metrics" },
                { icon: "⚡", title: "REAL-TIME", desc: "Instant responses with natural conversation flow" },
                { icon: "🔧", title: "CUSTOMIZABLE", desc: "Fully configurable appearance, voice, and behavior" }
              ].map((feature, index) => (
                <div key={index} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border-2 border-cyan-200 dark:border-cyan-800 hover:border-cyan-400 dark:hover:border-cyan-600 transition-all hover:scale-105">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h4 className="text-lg font-['Oranienbaum'] text-cyan-600 dark:text-cyan-400 mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-24 px-6 text-center scroll-mt-20">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-4xl sm:text-5xl font-['Oranienbaum'] bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
              READY TO TRANSFORM?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-['Rubik_Mono_One']">
              Join brands creating the future of customer engagement 🚀
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/ai/contact"
                className="inline-flex items-center gap-3 px-12 py-6 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-3xl font-['Rubik_Mono_One'] text-xl hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-cyan-500/50 group"
              >
                <span>GET STARTED</span>
                <span className="text-2xl group-hover:translate-x-2 transition-transform">→</span>
              </Link>
              <Link
                href="/ai/demo"
                className="inline-flex items-center gap-3 px-12 py-6 border-3 border-cyan-500 dark:border-cyan-400 text-cyan-700 dark:text-cyan-300 rounded-3xl font-['Rubik_Mono_One'] text-xl hover:bg-cyan-100 dark:hover:bg-cyan-900/30 hover:scale-105 transition-all duration-300"
              >
                <span>VIEW DEMO</span>
                <span className="text-2xl">🤖</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t-4 border-cyan-300 dark:border-cyan-700 p-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <p className="font-['Rubik_Mono_One'] text-cyan-700 dark:text-cyan-300">
                🤖 INTELLIGENT • 🎨 BRANDED • 🚀 ENGAGING
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <Link href="/ai/demo" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                Demo
              </Link>
              <Link href="/ai/pricing" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                Pricing
              </Link>
              <Link href="/ai/contact" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                Contact
              </Link>
              <Link href="/legal/terms-of-service" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                Terms of Service
              </Link>
              <Link href="/legal/privacy-policy" className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                Privacy Policy
              </Link>
            </div>
            <div className="text-center mt-4 text-xs text-gray-500 dark:text-gray-500">
              <p>Transform your brand with AI-powered interactive experiences.</p>
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
      `}</style>
    </div>
  );
}