"use client";

import React, { useState } from "react";
import Link from "next/link";
import { executeTrade } from "@/lib/api";
import type { HoldingWithPrice, TradeRequest, TradeResponse } from "@/types";
import { cn } from "@/lib/utils";

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

type Step = "entry" | "confirm" | "success";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

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
  const [step, setStep] = useState<Step>("entry");
  const [result, setResult] = useState<TradeResponse | null>(null);

  if (!isOpen) return null;

  const estimated = (shares || 0) * currentPrice;
  const canSell = currentHolding?.shares ?? 0;
  const cashAfter =
    side === "BUY"
      ? (availableCash ?? 0) - estimated
      : (availableCash ?? 0) + estimated;

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (shares <= 0) {
      setError("Enter shares greater than zero.");
      return;
    }
    if (side === "BUY" && estimated > (availableCash ?? 0)) {
      setError("Insufficient funds for this trade.");
      return;
    }
    if (side === "SELL" && shares > canSell) {
      setError("Not enough shares to sell.");
      return;
    }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);
    try {
      const req: TradeRequest = { symbol, type: side, shares };
      const resp = await executeTrade(req);
      setResult(resp);
      setStep("success");
      onSuccess?.(resp);
    } catch (err: any) {
      const msg = err?.message || "Trade failed. Try again.";
      setError(msg);
      setStep("entry");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("entry");
    setShares(0);
    setError(null);
    setResult(null);
    onClose();
  };

  const handleTradeAgain = () => {
    setStep("entry");
    setShares(0);
    setError(null);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-background p-6 shadow-2xl">
        {/* STEP 1: Entry */}
        {step === "entry" && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Trade {symbol}</h3>
              <button
                onClick={handleClose}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleReview}>
              {/* Buy/Sell toggle */}
              <div className="flex gap-2 rounded-xl bg-white/[0.03] p-1">
                {(["BUY", "SELL"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSide(s)}
                    className={cn(
                      "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all",
                      side === s
                        ? s === "BUY"
                          ? "bg-emerald-500 text-white shadow-sm"
                          : "bg-red-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Shares input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80" htmlFor="shares">
                  Shares
                </label>
                <input
                  id="shares"
                  type="number"
                  step="0.0001"
                  min="0"
                  value={shares || ""}
                  onChange={(e) => setShares(parseFloat(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 px-4 text-sm placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="0"
                  autoFocus
                />
              </div>

              {/* Summary */}
              <div className="space-y-2 rounded-xl bg-white/[0.03] p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price per share</span>
                  <span className="font-medium">{currency.format(currentPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Estimated {side === "BUY" ? "cost" : "proceeds"}
                  </span>
                  <span className="font-semibold">{currency.format(estimated)}</span>
                </div>
                {side === "BUY" && availableCash !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cash available</span>
                    <span>{currency.format(availableCash)}</span>
                  </div>
                )}
                {side === "SELL" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shares owned</span>
                    <span>{canSell.toFixed(4)}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className={cn(
                  "w-full rounded-xl py-3 text-sm font-semibold shadow-lg transition-all hover:-translate-y-0.5",
                  side === "BUY"
                    ? "bg-emerald-500 text-white shadow-emerald-500/25 hover:bg-emerald-500/90"
                    : "bg-red-500 text-white shadow-red-500/25 hover:bg-red-500/90"
                )}
              >
                Review Order
              </button>
            </form>
          </>
        )}

        {/* STEP 2: Confirmation */}
        {step === "confirm" && (
          <>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Review Your Trade</h3>
              <p className="mt-1 text-sm text-muted-foreground">Please confirm the details below</p>
            </div>

            <div className="mt-6 space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <div className="text-center">
                <span
                  className={cn(
                    "inline-block rounded-full px-3 py-1 text-xs font-bold uppercase",
                    side === "BUY" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  )}
                >
                  {side}
                </span>
                <p className="mt-2 text-2xl font-bold">
                  {shares.toFixed(4)} <span className="text-lg text-muted-foreground">shares of</span> {symbol}
                </p>
              </div>

              <div className="my-4 h-px bg-white/10" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price per share</span>
                  <span className="font-medium">{currency.format(currentPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total {side === "BUY" ? "cost" : "proceeds"}
                  </span>
                  <span className="font-bold text-lg">{currency.format(estimated)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Commission</span>
                  <span className="font-medium text-emerald-400">$0.00</span>
                </div>
                <div className="my-2 h-px bg-white/10" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cash after trade</span>
                  <span className="font-semibold">{currency.format(cashAfter)}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep("entry")}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-medium transition-all hover:bg-white/[0.05]"
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className={cn(
                  "flex-1 rounded-xl py-3 text-sm font-semibold shadow-lg transition-all",
                  side === "BUY"
                    ? "bg-emerald-500 text-white shadow-emerald-500/25 hover:bg-emerald-500/90"
                    : "bg-red-500 text-white shadow-red-500/25 hover:bg-red-500/90",
                  loading && "opacity-70 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Executing...
                  </span>
                ) : (
                  "Confirm Trade"
                )}
              </button>
            </div>
          </>
        )}

        {/* STEP 3: Success */}
        {step === "success" && result && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h3 className="text-xl font-bold">Trade Completed!</h3>
            <p className="mt-2 text-muted-foreground">
              You {side === "BUY" ? "bought" : "sold"}{" "}
              <span className="font-semibold text-foreground">{shares.toFixed(4)}</span> shares of{" "}
              <span className="font-semibold text-foreground">{symbol}</span>
            </p>

            <div className="mt-4 rounded-xl bg-white/[0.03] p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {side === "BUY" ? "Total spent" : "Total received"}
                </span>
                <span className="font-semibold">{currency.format(result.transaction.total_amount)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">New cash balance</span>
                <span className="font-semibold">{currency.format(result.portfolio.cash_balance)}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Link
                href="/dashboard"
                onClick={handleClose}
                className="flex-1 rounded-xl border border-white/10 py-3 text-center text-sm font-medium transition-all hover:bg-white/[0.05]"
              >
                View Portfolio
              </Link>
              <button
                onClick={handleTradeAgain}
                className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
              >
                Trade Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
