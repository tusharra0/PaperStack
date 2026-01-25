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
  Users,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import type { LeaderboardEntry } from "@/types";

// Lazy load TradingView widgets for better performance
const TickerTape = dynamic(
  () => import("@/components/tradingview/TickerTape"),
  { ssr: false }
);
const SymbolOverview = dynamic(
  () => import("@/components/tradingview/SymbolOverview"),
  { ssr: false }
);
const MarketOverview = dynamic(
  () => import("@/components/tradingview/MarketOverview"),
  { ssr: false }
);
const StockHeatmap = dynamic(
  () => import("@/components/tradingview/StockHeatmap"),
  { ssr: false }
);

const features = [
  {
    icon: Shield,
    title: "Risk-Free Trading",
    description:
      "Start with $100K virtual cash. Learn strategies without risking real money.",
  },
  {
    icon: Zap,
    title: "Real-Time Data",
    description:
      "Trade with live market prices powered by professional-grade market data.",
  },
  {
    icon: BarChart3,
    title: "Track Performance",
    description:
      "Monitor your portfolio with detailed analytics and performance charts.",
  },
  {
    icon: Trophy,
    title: "Compete & Win",
    description:
      "Climb the leaderboard and prove your trading skills against others.",
  },
];

const stats = [
  { value: "$100K", label: "Starting Capital" },
  { value: "Live", label: "Market Data" },
  { value: "Free", label: "Forever" },
];

export default function Home() {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (isInitialized && user) {
      router.replace("/dashboard");
    }
  }, [isInitialized, user, router]);

  // Hardcoded fake leaderboard
  const leaderboard: LeaderboardEntry[] = [
    { username: "Tushar Rao", total_return_percent: 142.5, rank: 1, total_value: 242500 },
    { username: "Tashiana Laluces", total_return_percent: 128.3, rank: 2, total_value: 228300 },
    { username: "Trader_992", total_return_percent: 89.4, rank: 3, total_value: 189400 },
    { username: "CryptoWhale00", total_return_percent: 76.1, rank: 4, total_value: 176100 },
    { username: "StockMaster_55", total_return_percent: 62.8, rank: 5, total_value: 162800 },
  ];

  // Show nothing while checking auth to prevent flash
  if (!isInitialized || user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Ticker Tape - Sticky below navbar */}
      <div className="sticky top-16 z-30 bg-background border-b border-white/5">
        <TickerTape />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-20 lg:pt-32 lg:pb-32">
        <div className="container relative">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            {/* Left - Content */}
            <div className="space-y-8">
              <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Master the market
                <span className="block text-primary">
                  without the risk
                </span>
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                Practice trading with $100K virtual cash and real-time market data.
                Test strategies, build confidence, compete with friends.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-white text-black px-8 py-4 text-base font-semibold hover:bg-gray-200 transition-colors"
                >
                  Start Trading Free
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg px-8 py-4 text-base font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  View Dashboard
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-12 pt-8">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-3xl font-bold text-white">
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Symbol Overview Widget (Seamless - No Border/Card) */}
            <div className="relative hidden lg:block">
              {/* Removed gradient glow */}
              <div className="relative overflow-hidden grayscale-[50%] hover:grayscale-0 transition-all duration-500">
                <SymbolOverview
                  symbols={[
                    ["Apple", "AAPL|1D"],
                    ["Microsoft", "MSFT|1D"],
                    ["NVIDIA", "NVDA|1D"],
                  ]}
                  height={400}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4 text-white">
              Professional Tools
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to master the markets.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative p-4 transition-all hover:bg-white/5 rounded-xl"
              >
                <div className="mb-4 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaderboard Preview (Seamless) */}
      <section className="py-24">
        <div className="container">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-4 text-white">
                Leaderboard
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Compete with top traders worldwide.
              </p>
              <Link
                href="/leaderboard"
                className="group inline-flex items-center gap-2 text-base font-semibold text-primary hover:opacity-80"
              >
                View Full Leaderboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="space-y-2">
              {leaderboard.map((entry, idx) => (
                <div
                  key={entry.username}
                  className="flex items-center justify-between px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className={`font-mono text-sm ${idx < 3 ? "text-primary" : "text-muted-foreground"}`}>
                      #{entry.rank}
                    </span>
                    <span className="font-medium text-lg text-gray-200">{entry.username}</span>
                  </div>
                  <span className="text-base font-medium text-primary">
                    +{entry.total_return_percent.toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 border-t border-border/40">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground mb-6">
              Getting Started
            </div>
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Start trading in minutes
            </h2>
            <p className="text-lg text-muted-foreground">
              No credit card required. Get $100K virtual cash instantly.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Create Account",
                description: "Sign up in seconds with just your email.",
              },
              {
                step: "02",
                title: "Find Stocks",
                description: "Search any symbol and view real-time quotes.",
              },
              {
                step: "03",
                title: "Start Trading",
                description: "Buy and sell with virtual cash. Track your performance.",
              },
            ].map((item, idx) => (
              <div key={item.step} className="relative">
                {idx < 2 && (
                  <div className="absolute left-1/2 top-12 hidden h-px w-full bg-gradient-to-r from-border via-border/50 to-transparent md:block" />
                )}
                <div className="relative rounded-2xl border border-border/50 bg-card/50 p-8 text-center transition-all hover:bg-card hover:border-border">
                  <span className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-3xl font-bold text-primary mb-6">
                    {item.step}
                  </span>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 border-t border-border/40">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-emerald-600 px-8 py-20 text-center shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1),transparent_70%)]" />
            <div className="relative">
              <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl text-white mb-6">
                Ready to start trading?
              </h2>
              <p className="mx-auto max-w-lg text-lg text-white/80 mb-10">
                Join thousands of traders learning and competing on PaperStack.
                Your $100K virtual account is waiting.
              </p>
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-10 py-5 text-lg font-semibold text-primary shadow-lg transition-all hover:bg-white/90 hover:shadow-xl hover:scale-[1.02]"
              >
                Create Free Account
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <p className="mt-8 text-sm text-white/60">
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
