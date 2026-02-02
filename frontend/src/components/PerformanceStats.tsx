"use client";

import { useEffect, useState } from "react";
import { getTradeStats } from "@/lib/api";
import type { TradeStats } from "@/types";
import { cn } from "@/lib/utils";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold tabular-nums", color)}>{value}</span>
    </div>
  );
}

export default function PerformanceStats() {
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getTradeStats();
        setStats(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
        <div className="mt-4 space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats || stats.total_trades === 0) return null;

  const winColor = stats.win_rate >= 50 ? "text-emerald-400" : "text-red-400";

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Your Stats</h2>
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        {/* Win rate bar */}
        <div className="mb-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Win Rate</span>
            <span className={cn("text-2xl font-bold", winColor)}>
              {stats.win_rate.toFixed(0)}%
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                stats.win_rate >= 50 ? "bg-emerald-400" : "bg-red-400"
              )}
              style={{ width: `${Math.min(stats.win_rate, 100)}%` }}
            />
          </div>
        </div>

        <div className="divide-y divide-white/5">
          <StatRow label="Total Trades" value={stats.total_trades.toString()} />
          <StatRow
            label="Best Trade"
            value={`${currency.format(stats.best_trade)} (${stats.best_symbol})`}
            color="text-emerald-400"
          />
          <StatRow
            label="Worst Trade"
            value={`${currency.format(stats.worst_trade)} (${stats.worst_symbol})`}
            color="text-red-400"
          />
          <StatRow
            label="Avg Holding Time"
            value={stats.avg_hold_days > 0 ? `${stats.avg_hold_days.toFixed(1)} days` : "N/A"}
          />
          <StatRow
            label="Most Traded"
            value={stats.most_traded ? `${stats.most_traded} (${stats.most_traded_count}x)` : "N/A"}
          />
        </div>
      </div>
    </div>
  );
}
