"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Shield,
  Trophy,
  BarChart3,
  ArrowRight,
  Zap,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import type { LeaderboardEntry } from "@/types";

// Lazy load TradingView widgets
const TickerTape = dynamic(
  () => import("@/components/tradingview/TickerTape"),
  { ssr: false }
);
const SymbolOverview = dynamic(
  () => import("@/components/tradingview/SymbolOverview"),
  { ssr: false }
);

const features = [
  {
    icon: Shield,
    title: "Risk-Free",
    description: "$100K virtual cash to practice with.",
  },
  {
    icon: Zap,
    title: "Real-Time",
    description: "Live market data and quotes.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Track your performance over time.",
  },
  {
    icon: Trophy,
    title: "Compete",
    description: "Climb the global leaderboard.",
  },
];

export default function Home() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();

  useEffect(() => {
    if (isInitialized && user) {
      router.replace("/dashboard");
    }
  }, [isInitialized, user, router]);

  const leaderboard: LeaderboardEntry[] = [
    { username: "Tushar Rao", total_return_percent: 142.5, rank: 1, total_value: 242500 },
    { username: "Tashiana Laluces", total_return_percent: 128.3, rank: 2, total_value: 228300 },
    { username: "Marcus Chen", total_return_percent: 89.4, rank: 3, total_value: 189400 },
    { username: "Sofia Williams", total_return_percent: 76.1, rank: 4, total_value: 176100 },
    { username: "Alex Kumar", total_return_percent: 62.8, rank: 5, total_value: 162800 },
  ];

  if (!isInitialized || user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Ticker Tape */}
      <div className="sticky top-16 z-30 bg-black border-b border-white/5">
        <TickerTape />
      </div>

      {/* Hero */}
      <section className="px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left */}
            <div className="space-y-6 md:space-y-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                Master the market
                <span className="block text-primary">without the risk</span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-neutral-400 max-w-md leading-relaxed">
                Practice trading with $100K virtual cash and real-time market data.
                Build confidence before risking real money.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 bg-white text-black px-6 py-3.5 sm:px-8 sm:py-4 rounded-lg text-sm sm:text-base font-semibold hover:bg-neutral-200 transition-colors"
                >
                  Start Trading Free
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:px-8 sm:py-4 rounded-lg text-sm sm:text-base font-semibold text-neutral-400 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
              </div>

              {/* Stats - Mobile friendly */}
              <div className="flex gap-8 sm:gap-12 pt-6 sm:pt-8">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold">$100K</p>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-1">Virtual Cash</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold">Live</p>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-1">Market Data</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold">Free</p>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-1">Forever</p>
                </div>
              </div>
            </div>

            {/* Right - Chart Widget */}
            <div className="hidden lg:block">
              <div className="rounded-xl overflow-hidden bg-neutral-950 border border-white/5">
                <SymbolOverview
                  symbols={[
                    ["Apple", "AAPL|1D"],
                    ["Microsoft", "MSFT|1D"],
                    ["NVIDIA", "NVDA|1D"],
                  ]}
                  height={380}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Clean grid */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="space-y-3">
                <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <h3 className="text-base sm:text-lg font-semibold">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                Leaderboard
              </h2>
              <p className="text-sm sm:text-base text-neutral-400 mb-6 sm:mb-8">
                Top traders this month. Can you beat them?
              </p>
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-2 text-sm sm:text-base font-medium text-primary hover:opacity-80 transition-opacity"
              >
                View All Rankings
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-1">
              {leaderboard.map((entry, idx) => (
                <div
                  key={entry.username}
                  className="flex items-center justify-between py-3 sm:py-4 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className={`font-mono text-xs sm:text-sm w-6 ${idx < 3 ? "text-primary" : "text-neutral-600"}`}>
                      {entry.rank}
                    </span>
                    <span className="text-sm sm:text-base text-neutral-200">{entry.username}</span>
                  </div>
                  <span className="text-sm sm:text-base font-medium text-green-400">
                    +{entry.total_return_percent.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works - Simple */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16">
            Start in 3 steps
          </h2>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              { num: "1", title: "Sign Up", desc: "Create your free account in seconds." },
              { num: "2", title: "Search", desc: "Find any stock with real-time quotes." },
              { num: "3", title: "Trade", desc: "Buy and sell with virtual cash." },
            ].map((step) => (
              <div key={step.num} className="text-center md:text-left">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 text-primary font-bold text-lg sm:text-xl mb-4">
                  {step.num}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-neutral-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Dark theme matching */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
            Ready to start?
          </h2>
          <p className="text-sm sm:text-base text-neutral-400 mb-8 sm:mb-10 max-w-md mx-auto">
            Join thousands of traders practicing on PaperStack.
            Your $100K virtual account is waiting.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-primary text-black px-8 py-4 sm:px-10 sm:py-5 rounded-lg text-base sm:text-lg font-semibold hover:opacity-90 transition-opacity"
          >
            Create Free Account
            <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-neutral-600">
            No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 lg:px-8 py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-neutral-600">
            © 2025 PaperStack. Practice trading, risk-free.
          </p>
          <div className="flex gap-6 text-xs sm:text-sm text-neutral-600">
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
