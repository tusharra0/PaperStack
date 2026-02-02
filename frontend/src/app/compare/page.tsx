"use client";

import { useState, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { searchStocks, getStockQuote, getStockHistory } from "@/lib/api";
import type { StockQuote, PricePoint } from "@/types";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Link from "next/link";

const COLORS = ["#818cf8", "#34d399", "#fb923c", "#f472b6"];
const MAX_STOCKS = 4;

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

type CompareStock = {
  quote: StockQuote;
  history: PricePoint[];
};

export default function ComparePage() {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { symbol: string; name: string }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [stocks, setStocks] = useState<CompareStock[]>([]);
  const [loadingSymbol, setLoadingSymbol] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(
    async (q: string) => {
      setQuery(q);
      if (q.length < 1) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const results = await searchStocks(q);
        setSearchResults(results.slice(0, 6));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    },
    []
  );

  const addStock = async (symbol: string) => {
    if (stocks.length >= MAX_STOCKS) {
      setError(`Maximum ${MAX_STOCKS} stocks for comparison.`);
      return;
    }
    if (stocks.some((s) => s.quote.symbol === symbol)) {
      setError(`${symbol} is already added.`);
      return;
    }
    setError(null);
    setLoadingSymbol(symbol);
    setQuery("");
    setSearchResults([]);
    try {
      const quote = await getStockQuote(symbol);
      const historyRes = await getStockHistory(symbol, "1M");
      setStocks((prev) => [...prev, { quote, history: historyRes.history }]);
    } catch {
      setError(`Failed to load data for ${symbol}.`);
    } finally {
      setLoadingSymbol(null);
    }
  };

  const removeStock = (symbol: string) => {
    setStocks((prev) => prev.filter((s) => s.quote.symbol !== symbol));
  };

  // Build normalized chart data (percentage change from first data point)
  const chartData = (() => {
    if (stocks.length === 0) return [];

    // Find the shortest history length to align data
    const minLen = Math.min(...stocks.map((s) => s.history.length));
    if (minLen === 0) return [];

    const data: Record<string, any>[] = [];
    for (let i = 0; i < minLen; i++) {
      const point: Record<string, any> = {
        date: stocks[0].history[i].date,
      };
      for (const stock of stocks) {
        const basePrice = stock.history[0].close;
        const currentPrice = stock.history[i].close;
        const pctChange =
          basePrice > 0 ? ((currentPrice - basePrice) / basePrice) * 100 : 0;
        point[stock.quote.symbol] = parseFloat(pctChange.toFixed(2));
      }
      data.push(point);
    }
    return data;
  })();

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compare Stocks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compare up to {MAX_STOCKS} stocks side by side with normalized
            performance charts
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <svg
              className="h-4 w-4 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search stocks to compare..."
              className="w-full bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none"
            />
            {searching && (
              <svg
                className="h-4 w-4 animate-spin text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-white/10 bg-background shadow-xl">
              {searchResults.map((r) => (
                <button
                  key={r.symbol}
                  onClick={() => addStock(r.symbol)}
                  disabled={
                    loadingSymbol === r.symbol ||
                    stocks.some((s) => s.quote.symbol === r.symbol)
                  }
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors hover:bg-white/[0.05]",
                    stocks.some((s) => s.quote.symbol === r.symbol) &&
                      "opacity-40 cursor-not-allowed"
                  )}
                >
                  <div>
                    <span className="font-semibold">{r.symbol}</span>
                    <span className="ml-2 text-muted-foreground">{r.name}</span>
                  </div>
                  {stocks.some((s) => s.quote.symbol === r.symbol) ? (
                    <span className="text-xs text-muted-foreground">Added</span>
                  ) : loadingSymbol === r.symbol ? (
                    <svg
                      className="h-4 w-4 animate-spin text-muted-foreground"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <svg
              className="h-4 w-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Selected stocks chips */}
        {stocks.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {stocks.map((s, i) => (
              <div
                key={s.quote.symbol}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5"
              >
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[i] }}
                />
                <span className="text-sm font-semibold">{s.quote.symbol}</span>
                <button
                  onClick={() => removeStock(s.quote.symbol)}
                  className="ml-1 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
            {stocks.length < MAX_STOCKS && (
              <span className="flex items-center text-xs text-muted-foreground">
                {MAX_STOCKS - stocks.length} more available
              </span>
            )}
          </div>
        )}

        {/* Empty State */}
        {stocks.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
            <svg
              className="mb-4 h-12 w-12 text-muted-foreground/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-muted-foreground/60">
              No stocks selected
            </h3>
            <p className="mt-1 text-sm text-muted-foreground/40">
              Search and add stocks above to start comparing
            </p>
          </div>
        )}

        {/* Normalized Performance Chart */}
        {stocks.length >= 2 && chartData.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              Normalized Performance (1 Month)
            </h2>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val: string) => {
                      const d = new Date(val);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                    minTickGap={40}
                  />
                  <YAxis
                    tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val: number) => `${val}%`}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      padding: "12px",
                    }}
                    labelStyle={{ color: "#a1a1aa", marginBottom: 4 }}
                    labelFormatter={(val: string) => {
                      const d = new Date(val);
                      return d.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                    }}
                    formatter={(value: number, name: string) => [
                      `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`,
                      name,
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 16 }}
                    formatter={(value: string) => (
                      <span className="text-sm text-foreground">{value}</span>
                    )}
                  />
                  {stocks.map((s, i) => (
                    <Line
                      key={s.quote.symbol}
                      type="monotone"
                      dataKey={s.quote.symbol}
                      stroke={COLORS[i]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {stocks.length === 1 && (
          <p className="text-sm text-muted-foreground">
            Add at least one more stock to see the comparison chart.
          </p>
        )}

        {/* Comparison Table */}
        {stocks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Side-by-Side Comparison</h2>
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Metric
                    </th>
                    {stocks.map((s, i) => (
                      <th
                        key={s.quote.symbol}
                        className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider"
                        style={{ color: COLORS[i] }}
                      >
                        {s.quote.symbol}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="px-6 py-3.5 text-sm text-muted-foreground">
                      Name
                    </td>
                    {stocks.map((s) => (
                      <td
                        key={s.quote.symbol}
                        className="px-6 py-3.5 text-right text-sm font-medium"
                      >
                        {s.quote.name}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-3.5 text-sm text-muted-foreground">
                      Price
                    </td>
                    {stocks.map((s) => (
                      <td
                        key={s.quote.symbol}
                        className="px-6 py-3.5 text-right text-sm font-semibold"
                      >
                        {currency.format(s.quote.price)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-3.5 text-sm text-muted-foreground">
                      Daily Change
                    </td>
                    {stocks.map((s) => (
                      <td
                        key={s.quote.symbol}
                        className={cn(
                          "px-6 py-3.5 text-right text-sm font-semibold",
                          s.quote.change >= 0
                            ? "text-emerald-400"
                            : "text-red-400"
                        )}
                      >
                        {s.quote.change >= 0 ? "+" : ""}
                        {s.quote.change_percent.toFixed(2)}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-3.5 text-sm text-muted-foreground">
                      Day High
                    </td>
                    {stocks.map((s) => (
                      <td
                        key={s.quote.symbol}
                        className="px-6 py-3.5 text-right text-sm font-medium"
                      >
                        {currency.format(s.quote.high)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-3.5 text-sm text-muted-foreground">
                      Day Low
                    </td>
                    {stocks.map((s) => (
                      <td
                        key={s.quote.symbol}
                        className="px-6 py-3.5 text-right text-sm font-medium"
                      >
                        {currency.format(s.quote.low)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-3.5 text-sm text-muted-foreground">
                      Volume
                    </td>
                    {stocks.map((s) => (
                      <td
                        key={s.quote.symbol}
                        className="px-6 py-3.5 text-right text-sm font-medium"
                      >
                        {s.quote.volume.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-3.5 text-sm text-muted-foreground">
                      1M Performance
                    </td>
                    {stocks.map((s) => {
                      const hist = s.history;
                      if (hist.length < 2)
                        return (
                          <td
                            key={s.quote.symbol}
                            className="px-6 py-3.5 text-right text-sm text-muted-foreground"
                          >
                            N/A
                          </td>
                        );
                      const pct =
                        ((hist[hist.length - 1].close - hist[0].close) /
                          hist[0].close) *
                        100;
                      return (
                        <td
                          key={s.quote.symbol}
                          className={cn(
                            "px-6 py-3.5 text-right text-sm font-semibold",
                            pct >= 0 ? "text-emerald-400" : "text-red-400"
                          )}
                        >
                          {pct >= 0 ? "+" : ""}
                          {pct.toFixed(2)}%
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Trade buttons */}
            <div className="flex flex-wrap gap-3">
              {stocks.map((s, i) => (
                <Link
                  key={s.quote.symbol}
                  href={`/trade/${s.quote.symbol}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium transition-all hover:bg-white/[0.06]"
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: COLORS[i] }}
                  />
                  Trade {s.quote.symbol}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
