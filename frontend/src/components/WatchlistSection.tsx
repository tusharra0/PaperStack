"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getWatchlist, removeFromWatchlist } from "@/lib/api";
import type { WatchlistItemWithPrice } from "@/types";
import { cn } from "@/lib/utils";

export default function WatchlistSection() {
  const [items, setItems] = useState<WatchlistItemWithPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getWatchlist();
        setItems(res.items);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRemove = async (symbol: string) => {
    try {
      await removeFromWatchlist(symbol);
      setItems((prev) => prev.filter((i) => i.symbol !== symbol));
    } catch {
      // silent fail
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Watchlist</h2>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex animate-pulse gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 flex-1 rounded-xl bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Watchlist</h2>
        <span className="text-sm text-muted-foreground">{items.length}/20</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const positive = item.change_percent >= 0;
          return (
            <div
              key={item.id}
              className="group relative rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04]"
            >
              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleRemove(item.symbol);
                }}
                className="absolute right-2 top-2 rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-white/10 hover:text-foreground group-hover:opacity-100"
                title="Remove from watchlist"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <Link href={`/trade/${item.symbol}`} className="block">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {item.symbol.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{item.symbol}</p>
                    <p className="text-sm font-medium tabular-nums">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      positive
                        ? "bg-emerald-400/10 text-emerald-400"
                        : "bg-red-400/10 text-red-400"
                    )}
                  >
                    {positive ? "+" : ""}
                    {item.change_percent.toFixed(2)}%
                  </span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
