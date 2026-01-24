"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getPortfolioHistory } from "@/lib/api";
import type { PortfolioHistoryResponse, SnapshotPoint } from "@/types";

const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const AreaChart = dynamic(() => import("recharts").then((mod) => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then((mod) => mod.Area), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const ReferenceLine = dynamic(
  () => import("recharts").then((mod) => mod.ReferenceLine),
  { ssr: false }
);

const periods = ["1W", "1M", "3M", "1Y", "ALL"];

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
          date: new Date(p.date).toLocaleDateString(),
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
  const positive = latestValue >= 100000;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Portfolio Performance</h3>
          <p className="text-sm text-muted-foreground">
            Overall return: {overallReturn >= 0 ? "+" : ""}
            {overallReturn.toFixed(2)}%
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-full px-3 py-1 font-semibold transition ${
                p === period ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-muted-foreground">Loading chart...</div>
      ) : error ? (
        <div className="py-10 text-center text-sm text-red-500">{error}</div>
      ) : points.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">No history yet.</div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ left: 12, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" minTickGap={20} tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                domain={["auto", "auto"]}
                width={70}
              />
              <ReferenceLine y={100000} stroke="#94a3b8" strokeDasharray="4 4" />
              <Tooltip
                formatter={(value: any) => {
                  const num = typeof value === "number" ? value : Number(value);
                  return [`$${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, "Value"];
                }}
                labelStyle={{ color: "var(--muted-foreground)" }}
              />
              <Area
                type="monotone"
                dataKey="total_value"
                stroke={positive ? "#10b981" : "#ef4444"}
                fill={positive ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

