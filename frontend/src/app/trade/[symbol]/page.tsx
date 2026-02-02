"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import StockChart from "@/components/StockChart";
import TradeModal from "@/components/TradeModal";
import LivePrice from "@/components/LivePrice";
import WatchlistStar from "@/components/WatchlistStar";
import { getPortfolio, getStockQuote, checkBadges } from "@/lib/api";
import type { HoldingWithPrice, PortfolioResponse, StockQuote, TradeResponse } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

export default function TradePage() {
  const params = useParams<{ symbol: string }>();
  const symbol = (params?.symbol || "").toUpperCase();
  const { user } = useAuthStore();

  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"BUY" | "SELL">("BUY");

  const holding: HoldingWithPrice | null = useMemo(() => {
    if (!portfolio) return null;
    const holdings = portfolio.holdings || [];
    return (holdings.find((h) => h.symbol === symbol) as HoldingWithPrice | undefined) || null;
  }, [portfolio, symbol]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [q, p] = await Promise.all([getStockQuote(symbol), getPortfolio()]);
        setQuote(q);
        setPortfolio(p);
      } catch (err: any) {
        const msg = err?.message || "Unable to load stock.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    if (symbol) load();
  }, [symbol]);

  const changePositive = (quote?.change ?? 0) >= 0;

  const handleTradeSuccess = async (_resp: TradeResponse) => {
    const updated = await getPortfolio();
    setPortfolio(updated);
    // Check for new badges after trade
    checkBadges().catch(() => {});
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Trading</p>
            <h1 className="text-2xl font-semibold">
              {quote?.name || symbol} ({symbol})
            </h1>
            {quote && (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="text-3xl font-bold">${quote.price.toFixed(2)}</span>
                <span
                  className={cn(
                    "text-sm font-semibold",
                    changePositive ? "text-green-600" : "text-red-600"
                  )}
                >
                  {changePositive ? "+" : ""}
                  {quote.change.toFixed(2)} ({quote.change_percent.toFixed(2)}%)
                </span>
                <LivePrice symbol={symbol} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <WatchlistStar symbol={symbol} />
            <button
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
              onClick={() => {
                setMode("BUY");
                setModalOpen(true);
              }}
            >
              Buy
            </button>
            <button
              className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-muted"
              onClick={() => {
                setMode("SELL");
                setModalOpen(true);
              }}
            >
              Sell
            </button>
          </div>
        </div>

        {loading && (
          <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">Loading...</div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {!loading && !error && (
          <>
            <StockChart symbol={symbol} />
            {holding && (
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold">Your Position</h3>
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Shares</p>
                    <p className="font-semibold">{holding.shares.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Cost</p>
                    <p className="font-semibold">${holding.average_cost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Market Value</p>
                    <p className="font-semibold">${holding.market_value.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gain/Loss</p>
                    <p
                      className={cn(
                        "font-semibold",
                        (holding.gain_loss ?? 0) >= 0 ? "text-green-600" : "text-red-600"
                      )}
                    >
                      ${holding.gain_loss.toFixed(2)} ({holding.gain_loss_percent.toFixed(2)}%)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {quote && modalOpen && portfolio && (
        <TradeModal
          symbol={symbol}
          currentPrice={quote.price}
          isOpen={modalOpen}
          mode={mode}
          onClose={() => setModalOpen(false)}
          onSuccess={handleTradeSuccess}
          availableCash={portfolio.cash_balance}
          currentHolding={holding}
        />
      )}
    </ProtectedRoute>
  );
}
