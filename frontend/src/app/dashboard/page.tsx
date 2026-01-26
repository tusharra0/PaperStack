"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import HoldingsTable from "@/components/HoldingsTable";
import PortfolioChart from "@/components/PortfolioChart";
import { getPortfolio } from "@/lib/api";
import type { PortfolioResponse } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function StatCard({
  label,
  value,
  subValue,
  icon,
  trend,
}: {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-all hover:bg-white/[0.04]">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subValue && (
            <p
              className={cn(
                "text-sm font-medium",
                trend === "up" && "text-emerald-400",
                trend === "down" && "text-red-400",
                trend === "neutral" && "text-muted-foreground"
              )}
            >
              {subValue}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-white/[0.05] p-2.5 text-muted-foreground">
          {icon}
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-all hover:border-primary/30 hover:bg-white/[0.04]"
    >
      <div className="rounded-lg bg-primary/10 p-2.5 text-primary transition-colors group-hover:bg-primary/20">
        {icon}
      </div>
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <svg
        className="ml-auto h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-5 w-32 rounded bg-white/10" />
        <div className="h-8 w-48 rounded bg-white/10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-white/5" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-white/5" />
      <div className="h-64 rounded-2xl bg-white/5" />
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!isInitialized || !user || hasFetched.current) {
      return;
    }

    hasFetched.current = true;
    const load = async () => {
      try {
        const data = await getPortfolio();
        setPortfolio(data);
      } catch (err: any) {
        const msg = err?.message || "Failed to load portfolio.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isInitialized, user]);

  const totalReturn = portfolio?.total_return ?? 0;
  const totalReturnPercent = portfolio?.total_return_percent ?? 0;
  const isPositive = totalReturn >= 0;
  const holdingsCount = portfolio?.holdings?.length ?? 0;
  const investedValue = (portfolio?.total_value ?? 0) - (portfolio?.cash_balance ?? 0);

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{getGreeting()}</p>
            <h1 className="text-3xl font-bold tracking-tight">
              {user?.username || "Trader"}
            </h1>
          </div>
          <div className="flex gap-3">
            <Link
              href="/history"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm font-medium transition-all hover:bg-white/[0.05]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </Link>
            <Link
              href="/trade"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Trade
            </Link>
          </div>
        </div>

        {loading && <DashboardSkeleton />}

        {error && !loading && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        {portfolio && !loading && (
          <>
            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Portfolio Value"
                value={formatter.format(portfolio.total_value)}
                subValue={`${isPositive ? "+" : ""}${formatter.format(totalReturn)} (${totalReturnPercent.toFixed(2)}%)`}
                trend={isPositive ? "up" : "down"}
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                }
              />
              <StatCard
                label="Cash Available"
                value={formatter.format(portfolio.cash_balance)}
                subValue={`${((portfolio.cash_balance / portfolio.total_value) * 100).toFixed(1)}% of portfolio`}
                trend="neutral"
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatCard
                label="Invested"
                value={formatter.format(investedValue)}
                subValue={`${holdingsCount} position${holdingsCount !== 1 ? "s" : ""}`}
                trend="neutral"
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                  </svg>
                }
              />
              <StatCard
                label="Today's Return"
                value={`${isPositive ? "+" : ""}${totalReturnPercent.toFixed(2)}%`}
                subValue={isPositive ? "Outperforming" : "Underperforming"}
                trend={isPositive ? "up" : "down"}
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                }
              />
            </div>

            {/* Chart */}
            <PortfolioChart />

            {/* Holdings Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Holdings</h2>
                  <p className="text-sm text-muted-foreground">
                    {holdingsCount} active position{holdingsCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <Link
                  href="/trade"
                  className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Add position
                </Link>
              </div>
              <HoldingsTable holdings={portfolio.holdings ?? []} />
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Quick Actions</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <QuickAction
                  href="/trade"
                  label="Search Stocks"
                  description="Find and analyze stocks to trade"
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  }
                />
                <QuickAction
                  href="/history"
                  label="Trade History"
                  description="View your past transactions"
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  }
                />
                <QuickAction
                  href="/leaderboard"
                  label="Leaderboard"
                  description="See how you rank against others"
                  icon={
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                    </svg>
                  }
                />
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
