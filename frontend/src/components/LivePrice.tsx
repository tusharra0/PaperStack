"use client";

import { useEffect, useRef, useState } from "react";
import useWebSocket from "@/hooks/useWebSocket";

interface Props {
  symbol: string;
}

export default function LivePrice({ symbol }: Props) {
  const { prices, subscribe, unsubscribe } = useWebSocket();
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevPrice = useRef<number | null>(null);

  const price = prices[symbol]?.price;

  useEffect(() => {
    subscribe([symbol]);
    return () => unsubscribe([symbol]);
  }, [symbol]);

  useEffect(() => {
    if (price === undefined || price === null) return;
    if (prevPrice.current !== null) {
      if (price > prevPrice.current) setFlash("up");
      else if (price < prevPrice.current) setFlash("down");
    }
    prevPrice.current = price;
    const timer = setTimeout(() => setFlash(null), 500);
    return () => clearTimeout(timer);
  }, [price]);

  return (
    <div className="flex items-center gap-2 text-sm font-semibold">
      <span className="flex items-center gap-1 text-xs uppercase tracking-wide text-emerald-600">
        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> LIVE
      </span>
      <span
        className={`rounded-md px-2 py-1 transition ${
          flash === "up"
            ? "bg-emerald-100 text-emerald-700"
            : flash === "down"
            ? "bg-red-100 text-red-700"
            : "bg-muted text-foreground"
        }`}
      >
        {price ? `$${price.toFixed(2)}` : "--"}
      </span>
    </div>
  );
}

