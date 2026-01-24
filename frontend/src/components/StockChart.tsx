"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getStockHistory } from "@/lib/api";
import type { PricePoint, StockHistoryResponse } from "@/types";

const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const LineChart = dynamic(
  () => import("recharts").then((mod) => mod.LineChart),
  { ssr: false }
);
const Line = dynamic(() => import("recharts").then((mod) => mod.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
);

const periods = ["1D", "1W", "1M", "3M", "1Y"];

type Props = {
  symbol: string;
};

export default function StockChart({ symbol }: Props) {
  const [period, setPeriod] = useState("1M");
  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res: StockHistoryResponse = await getStockHistory(symbol, period);
        setData(
          res.history.map((p) => ({
            ...p,
            date: new Date(p.date).toLocaleDateString(),
          }))
        );
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [symbol, period]);

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Price History</h3>
        <div className="flex gap-2 text-xs">
          {periods.map((p) => (
            <button
              key={p}
              className={`rounded-md px-2 py-1 ${
                p === period ? "bg-primary text-primary-foreground" : "border"
              }`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="py-10 text-center text-sm text-muted-foreground">Loading chart...</div>
      ) : data.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">No data</div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 12, right: 12 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" minTickGap={20} />
              <YAxis domain={["auto", "auto"]} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(value) => {
                  const num = typeof value === "number" ? value : Number(value);
                  return [`$${num.toFixed(2)}`, "Price"];
                }}
                labelStyle={{ color: "var(--muted-foreground)" }}
              />
              <Line type="monotone" dataKey="close" stroke="#0ea5e9" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

