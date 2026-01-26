"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import type { HoldingWithPrice } from "@/types";
import { cn } from "@/lib/utils";
import useWebSocket from "@/hooks/useWebSocket";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

type Props = {
  holdings?: HoldingWithPrice[] | null;
};

export default function HoldingsTable({ holdings }: Props) {
  const safeHoldings = holdings ?? [];
  const { prices, subscribe, unsubscribe } = useWebSocket();

  useEffect(() => {
    const symbols = safeHoldings.map((h) => h.symbol);
    if (symbols.length) {
      subscribe(symbols);
      return () => unsubscribe(symbols);
    }
  }, [safeHoldings]);

  if (!safeHoldings.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
        <div className="mb-4 rounded-full bg-white/[0.05] p-4">
          <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
          </svg>
        </div>
        <p className="text-sm font-medium">No holdings yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Search for stocks and place your first trade
        </p>
        <Link
          href="/trade"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Start Trading
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Symbol</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Shares</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg Cost</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Value</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">P&L</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Return</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {safeHoldings.map((h) => {
              const livePrice = prices[h.symbol]?.price ?? h.current_price;
              const marketValue = livePrice * h.shares;
              const costBasis = h.average_cost * h.shares;
              const gain = marketValue - costBasis;
              const gainPct = costBasis > 0 ? (gain / costBasis) * 100 : 0;
              const positive = gain >= 0;
              return (
                <tr
                  key={h.id}
                  className="group cursor-pointer transition-colors hover:bg-white/[0.03]"
                  onClick={() => (window.location.href = `/trade/${h.symbol}`)}
                >
                  <td className="px-4 py-4">
                    <Link href={`/trade/${h.symbol}`} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                        {h.symbol.slice(0, 2)}
                      </div>
                      <span className="font-semibold">{h.symbol}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-right font-medium tabular-nums">{h.shares.toFixed(4)}</td>
                  <td className="px-4 py-4 text-right tabular-nums text-muted-foreground">{currency.format(h.average_cost)}</td>
                  <td className="px-4 py-4 text-right font-medium tabular-nums">{currency.format(livePrice)}</td>
                  <td className="px-4 py-4 text-right font-medium tabular-nums">{currency.format(marketValue)}</td>
                  <td className={cn("px-4 py-4 text-right font-semibold tabular-nums", positive ? "text-emerald-400" : "text-red-400")}>
                    {positive ? "+" : ""}{currency.format(gain)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                      positive ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"
                    )}>
                      {positive ? "+" : ""}{gainPct.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-white/5">
        {safeHoldings.map((h) => {
          const livePrice = prices[h.symbol]?.price ?? h.current_price;
          const marketValue = livePrice * h.shares;
          const costBasis = h.average_cost * h.shares;
          const gain = marketValue - costBasis;
          const gainPct = costBasis > 0 ? (gain / costBasis) * 100 : 0;
          const positive = gain >= 0;
          return (
            <Link
              key={h.id}
              href={`/trade/${h.symbol}`}
              className="block p-4 transition-colors hover:bg-white/[0.03]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {h.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold">{h.symbol}</p>
                    <p className="text-sm text-muted-foreground">{h.shares.toFixed(4)} shares</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{currency.format(marketValue)}</p>
                  <p className={cn("text-sm font-medium", positive ? "text-emerald-400" : "text-red-400")}>
                    {positive ? "+" : ""}{gainPct.toFixed(2)}%
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
