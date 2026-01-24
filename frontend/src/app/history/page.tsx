"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { getTransactions } from "@/lib/api";
import type { Transaction } from "@/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getTransactions({ limit: 50, offset: 0 });
        setTransactions(res.transactions);
      } catch (err: any) {
        const msg = err?.message || "Failed to load history.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <ProtectedRoute>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Transaction History</h1>

        {loading && (
          <div className="space-y-2 rounded-lg border p-4">
            {[...Array(5)].map((_, idx) => (
              <Skeleton key={idx} className="h-10 w-full" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {!loading && !error && transactions.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No transactions yet.
          </div>
        )}

        {!loading && transactions.length > 0 && (
          <div className="overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Date</th>
                  <th className="px-3 py-2 text-left font-semibold">Symbol</th>
                  <th className="px-3 py-2 text-left font-semibold">Type</th>
                  <th className="px-3 py-2 text-right font-semibold">Shares</th>
                  <th className="px-3 py-2 text-right font-semibold">Price</th>
                  <th className="px-3 py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const positive = t.type === "SELL";
                  return (
                    <tr key={t.id} className="border-b">
                      <td className="px-3 py-2">{new Date(t.created_at).toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <Link href={`/trade/${t.symbol}`} className="font-semibold hover:underline">
                          {t.symbol}
                        </Link>
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2 font-semibold",
                          t.type === "BUY" ? "text-green-600" : "text-blue-600"
                        )}
                      >
                        {t.type}
                      </td>
                      <td className="px-3 py-2 text-right">{t.shares.toFixed(4)}</td>
                      <td className="px-3 py-2 text-right">${t.price_per_share.toFixed(2)}</td>
                      <td
                        className={cn(
                          "px-3 py-2 text-right font-semibold",
                          positive ? "text-blue-600" : "text-green-600"
                        )}
                      >
                        ${t.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

