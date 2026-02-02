"use client";

import { useEffect, useState } from "react";
import { isWatched, addToWatchlist, removeFromWatchlist } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function WatchlistStar({ symbol }: { symbol: string }) {
  const [watched, setWatched] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await isWatched(symbol);
        setWatched(res.watched);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    if (symbol) check();
  }, [symbol]);

  const toggle = async () => {
    try {
      if (watched) {
        await removeFromWatchlist(symbol);
        setWatched(false);
      } else {
        await addToWatchlist(symbol);
        setWatched(true);
      }
    } catch {
      // silent
    }
  };

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      className={cn(
        "rounded-lg p-2 transition-all",
        watched
          ? "bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20"
          : "bg-white/[0.05] text-muted-foreground hover:bg-white/10 hover:text-yellow-400"
      )}
      title={watched ? "Remove from watchlist" : "Add to watchlist"}
    >
      {watched ? (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      )}
    </button>
  );
}
