"use client";

import StockSearch from "@/components/StockSearch";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function TradeIndexPage() {
  const router = useRouter();

  const handleSelect = (symbol: string) => {
    router.push(`/trade/${symbol.toUpperCase()}`);
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-xl border bg-card p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Trade a stock</h1>
        <p className="text-sm text-muted-foreground">
          Search for any symbol to open its trade ticket and live chart.
        </p>
        <div className="w-full max-w-xl">
          <StockSearch placeholder="Search by symbol or name" onSelect={handleSelect} />
        </div>
      </div>
    </ProtectedRoute>
  );
}
