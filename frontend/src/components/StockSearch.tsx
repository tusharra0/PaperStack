"use client";

import { useEffect, useRef, useState } from "react";
import { searchStocks } from "@/lib/api";
import type { SearchResult } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  onSelect?: (symbol: string) => void;
  placeholder?: string;
  compact?: boolean;
};

export default function StockSearch({ onSelect, placeholder, compact = false }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!query || query.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await searchStocks(query);
        setResults(res);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (symbol: string) => {
    setOpen(false);
    setQuery("");
    onSelect?.(symbol);
    window.location.href = `/trade/${symbol}`;
  };

  return (
    <div className={cn("relative w-full", compact ? "max-w-xs" : "max-w-lg")} ref={containerRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className={cn(
          "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
          compact && "text-xs"
        )}
        placeholder={placeholder || "Search stocks by symbol or name"}
        onFocus={() => query.length >= 2 && setOpen(true)}
      />
      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-md border bg-popover shadow-lg">
          {loading ? (
            <div className="p-3 text-sm text-muted-foreground">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">No results</div>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {results.map((r) => (
                <li
                  key={r.symbol}
                  className={cn("cursor-pointer px-3 py-2 hover:bg-muted/60")}
                  onClick={() => handleSelect(r.symbol)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{r.symbol}</span>
                    <span className="text-xs text-muted-foreground">{r.exchange}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{r.name}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

