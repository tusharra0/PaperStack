"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getPortfolioHistory } from "@/lib/api";
import type { PortfolioHistoryResponse, SnapshotPoint } from "@/types";
import { cn } from "@/lib/utils";

const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const AreaChart = dynamic(() => import("recharts").then((mod) => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then((mod) => mod.Area), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ReferenceLine = dynamic(
  () => import("recharts").then((mod) => mod.ReferenceLine),
  { ssr: false }
);

const periods = [
  { key: "1W", label: "1W" },
  { key: "1M", label: "1M" },
  { key: "3M", label: "3M" },
  { key: "1Y", label: "1Y" },
  { key: "ALL", label: "All" },
];

export default function PortfolioChart() {
  const [period, setPeriod] = useState<string>("1M");
  const [points, setPoints] = useState<SnapshotPoint[]>([]);
  const [overallReturn, setOverallReturn] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res: PortfolioHistoryResponse = await getPortfolioHistory(period);
        const normalized = res.points.map((p) => ({
          ...p,
          date: new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        }));
        setPoints(normalized);
        if (normalized.length >= 2) {
          const first = normalized[0].total_value;
          const last = normalized[normalized.length - 1].total_value;
          const ret = ((last - first) / first) * 100;
          setOverallReturn(ret);
        } else {
          setOverallReturn(0);
        }
      } catch (err: any) {
        setError(err?.message || "Unable to load history");
        setPoints([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period]);

  const latestValue = points.length ? points[points.length - 1].total_value : 100000;
  const positive = overallReturn >= 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Performance</h3>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={cn(
              "text-2xl font-bold",
              positive ? "text-emerald-400" : "text-red-400"
            )}>
              {positive ? "+" : ""}{overallReturn.toFixed(2)}%
            </span>
            <span className="text-sm text-muted-foreground">
              {period === "ALL" ? "all time" : `past ${period.toLowerCase()}`}
            </span>
          </div>
        </div>
        <div className="flex rounded-xl bg-white/[0.03] p-1">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                p.key === period
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="flex h-72 items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading chart...
          </div>
        </div>
      ) : error ? (
        <div className="flex h-72 items-center justify-center">
          <div className="text-center">
            <svg className="mx-auto h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="mt-2 text-sm text-red-400">{error}</p>
          </div>
        </div>
      ) : points.length === 0 ? (
        <div className="flex h-72 flex-col items-center justify-center text-center">
          <div className="mb-3 rounded-full bg-white/[0.05] p-3">
            <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">No history yet</p>
          <p className="mt-1 text-xs text-muted-foreground/70">Start trading to see your performance</p>
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={positive ? "#34d399" : "#f87171"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={positive ? "#34d399" : "#f87171"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                minTickGap={40}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                domain={["auto", "auto"]}
                width={60}
              />
              <ReferenceLine
                y={100000}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                strokeOpacity={0.3}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(0 0% 5%)",
                  border: "1px solid hsl(0 0% 20%)",
                  borderRadius: "12px",
                  padding: "12px",
                }}
                labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}
                formatter={(value: any) => {
                  const num = typeof value === "number" ? value : Number(value);
                  return [
                    <span key="value" className="font-semibold">
                      ${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>,
                    "Portfolio Value",
                  ];
                }}
              />
              <Area
                type="monotone"
                dataKey="total_value"
                stroke={positive ? "#34d399" : "#f87171"}
                fill="url(#colorValue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
