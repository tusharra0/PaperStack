"use client";

import { useEffect, useState } from "react";
import { getLeaderboard } from "@/lib/api";
import type { LeaderboardEntry, LeaderboardResponse } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { Skeleton } from "@/components/ui/skeleton";

const medals: Record<number, string> = {
  1: "??",
  2: "??",
  3: "??",
};

export default function LeaderboardPage() {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getLeaderboard(50);
        setData(res);
      } catch (err: any) {
        setError(err?.message || "Failed to load leaderboard.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatCurrency = (val: number) =>
    val.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  const formatReturn = (val: number) => `${val.toFixed(2)}%`;

  const highlightRank = data?.current_user_rank && data.current_user_rank > (data.entries?.length || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Climb the ladder</p>
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">Ranked by total return since you started with $100,000.</p>
        </div>
        {highlightRank && (
          <div className="rounded-lg border border-dashed bg-muted/50 px-4 py-3 text-sm">
            <p className="font-semibold">Your Rank</p>
            <p className="text-2xl font-bold">#{data?.current_user_rank}</p>
          </div>
        )}
      </div>

      {loading && (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="divide-y divide-border">
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {data && !loading && (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Username
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Return %
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.entries.map((entry: LeaderboardEntry) => {
                const isUser = user?.username === entry.username;
                const medal = medals[entry.rank];
                const positive = entry.total_return_percent >= 0;
                return (
                  <tr
                    key={`${entry.rank}-${entry.username}`}
                    className={`transition hover:bg-muted/60 ${isUser ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-4 py-3 text-sm font-semibold">
                      <span className="mr-2 inline-block w-6 text-center text-lg">
                        {medal ? medal : `#${entry.rank}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{entry.username}</td>
                    <td
                      className={`px-4 py-3 text-right text-sm font-semibold ${
                        positive ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {formatReturn(entry.total_return_percent)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      {formatCurrency(entry.total_value)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

