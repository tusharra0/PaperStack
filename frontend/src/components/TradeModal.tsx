"use client";

import React, { useState } from "react";
import { executeTrade } from "@/lib/api";
import type { HoldingWithPrice, TradeRequest, TradeResponse } from "@/types";
import { cn } from "@/lib/utils";
import { showToast } from "@/components/ToastContainer";

type Props = {
  symbol: string;
  currentPrice: number;
  isOpen: boolean;
  mode: "BUY" | "SELL";
  onClose: () => void;
  onSuccess?: (resp: TradeResponse) => void;
  availableCash?: number;
  currentHolding?: HoldingWithPrice | null;
};

export default function TradeModal({
  symbol,
  currentPrice,
  isOpen,
  mode,
  onClose,
  onSuccess,
  availableCash,
  currentHolding,
}: Props) {
  const [shares, setShares] = useState<number>(0);
  const [side, setSide] = useState<"BUY" | "SELL">(mode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const estimated = (shares || 0) * currentPrice;
  const canSell = currentHolding?.shares ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (shares <= 0) {
      setError("Enter shares greater than zero.");
      return;
    }
    if (side === "SELL" && shares > canSell) {
      setError("Not enough shares to sell.");
      return;
    }
    setLoading(true);
    try {
      const req: TradeRequest = { symbol, type: side, shares };
      const resp = await executeTrade(req);
      onSuccess?.(resp);
      showToast("Trade executed successfully", "success");
      onClose();
      setShares(0);
    } catch (err: any) {
      const msg = err?.message || "Trade failed. Try again.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {side} {symbol}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            x
          </button>
        </div>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div className="flex gap-3">
            {(["BUY", "SELL"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                className={cn(
                  "flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition",
                  side === s ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="shares">
              Shares
            </label>
            <input
              id="shares"
              type="number"
              step="0.0001"
              min="0"
              value={shares || ""}
              onChange={(e) => setShares(parseFloat(e.target.value))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="0"
            />
          </div>
          <div className="rounded-md bg-muted px-3 py-2 text-sm">
            <div className="flex justify-between">
              <span>Current price</span>
              <span>${currentPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated {side === "BUY" ? "cost" : "proceeds"}</span>
              <span>${estimated.toFixed(2)}</span>
            </div>
            {side === "BUY" && availableCash !== undefined && (
              <div className="flex justify-between">
                <span>Cash available</span>
                <span>${(availableCash ?? 0).toFixed(2)}</span>
              </div>
            )}
            {side === "SELL" && (
              <div className="flex justify-between">
                <span>Shares available</span>
                <span>{canSell.toFixed(4)}</span>
              </div>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Submitting..." : `${side} ${symbol}`}
          </button>
        </form>
      </div>
    </div>
  );
}

