"use client";

import { useEffect, useState, useRef } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import PortfolioSummary from "@/components/PortfolioSummary";
import HoldingsTable from "@/components/HoldingsTable";
import PortfolioChart from "@/components/PortfolioChart";
import { getPortfolio } from "@/lib/api";
import type { PortfolioResponse } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { Skeleton } from "@/components/ui/skeleton";

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

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="text-2xl font-semibold">{user?.username || "Trader"}</h1>
          </div>
          <a
            href="/trade"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            Search &amp; Trade
          </a>
        </div>

        {loading && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-36 w-full" />
            </div>
            <div className="lg:col-span-2 space-y-3">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-64 w-full" />
              {[...Array(4)].map((_, idx) => (
                <Skeleton key={idx} className="h-10 w-full" />
              ))}
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {portfolio && !loading && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <PortfolioSummary
                totalValue={portfolio.total_value}
                cashBalance={portfolio.cash_balance}
                totalReturn={portfolio.total_return}
                totalReturnPercent={portfolio.total_return_percent}
              />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <PortfolioChart />
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Holdings</h2>
                <a
                  href="/trade"
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Add positions
                </a>
              </div>
              <HoldingsTable holdings={portfolio.holdings ?? []} />
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

