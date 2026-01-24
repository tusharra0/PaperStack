"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No holdings yet. Search for stocks and place your first trade.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead className="text-right">Shares</TableHead>
            <TableHead className="text-right">Avg Cost</TableHead>
            <TableHead className="text-right">Live Price</TableHead>
            <TableHead className="text-right">Market Value</TableHead>
            <TableHead className="text-right">Gain/Loss</TableHead>
            <TableHead className="text-right">Gain/Loss %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {safeHoldings.map((h) => {
            const livePrice = prices[h.symbol]?.price ?? h.current_price;
            const marketValue = livePrice * h.shares;
            const costBasis = h.average_cost * h.shares;
            const gain = marketValue - costBasis;
            const gainPct = costBasis > 0 ? (gain / costBasis) * 100 : 0;
            const positive = gain >= 0;
            return (
              <TableRow
                key={h.id}
                className="cursor-pointer"
                onClick={() => (window.location.href = `/trade/${h.symbol}`)}
              >
                <TableCell className="font-semibold">
                  <Link href={`/trade/${h.symbol}`}>{h.symbol}</Link>
                </TableCell>
                <TableCell className="text-right">{h.shares.toFixed(4)}</TableCell>
                <TableCell className="text-right">{currency.format(h.average_cost)}</TableCell>
                <TableCell className="text-right">{currency.format(livePrice)}</TableCell>
                <TableCell className="text-right">{currency.format(marketValue)}</TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium",
                    positive ? "text-green-600" : "text-red-600"
                  )}
                >
                  {currency.format(gain)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium",
                    positive ? "text-green-600" : "text-red-600"
                  )}
                >
                  {gainPct.toFixed(2)}%
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

