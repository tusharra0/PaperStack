"use client";

import { cn } from "@/lib/utils";
import type { HoldingWithPrice } from "@/types";

// Sector mapping for common stocks (simplified)
const SECTOR_MAP: Record<string, string> = {
  AAPL: "Technology", MSFT: "Technology", GOOGL: "Technology", GOOG: "Technology",
  META: "Technology", AMZN: "Consumer", TSLA: "Automotive", NVDA: "Technology",
  AMD: "Technology", INTC: "Technology", CRM: "Technology", ORCL: "Technology",
  NFLX: "Entertainment", DIS: "Entertainment", SPOT: "Entertainment",
  JPM: "Finance", BAC: "Finance", GS: "Finance", V: "Finance", MA: "Finance",
  JNJ: "Healthcare", PFE: "Healthcare", UNH: "Healthcare", ABBV: "Healthcare",
  XOM: "Energy", CVX: "Energy", COP: "Energy",
  KO: "Consumer", PEP: "Consumer", WMT: "Consumer", COST: "Consumer",
  BA: "Industrial", CAT: "Industrial", GE: "Industrial",
  MDB: "Technology", SNOW: "Technology", PLTR: "Technology", NET: "Technology",
};

function getSector(symbol: string): string {
  return SECTOR_MAP[symbol] || "Other";
}

function calculateScore(holdings: HoldingWithPrice[], totalValue: number): { score: number; tip: string } {
  let score = 50;
  const count = holdings.length;

  // Check concentration
  for (const h of holdings) {
    const weight = (h.market_value / totalValue) * 100;
    if (weight > 50) {
      score -= 20;
      break;
    } else if (weight > 30) {
      score -= 10;
      break;
    }
  }

  // Check count
  if (count <= 2) {
    score -= 15;
  } else if (count <= 4) {
    score += 10;
  } else {
    score += 20;
  }

  // Check sector diversity
  const sectors = new Set(holdings.map((h) => getSector(h.symbol)));
  if (sectors.size >= 3) {
    score += 15;
  }

  // Clamp 0-100
  score = Math.max(0, Math.min(100, score));

  // Tip
  let tip = "Your portfolio looks well diversified!";
  if (count === 0) {
    tip = "Start trading to build your portfolio";
  } else if (count <= 2) {
    tip = "Add more stocks to reduce risk";
  } else if (sectors.size < 3) {
    tip = "Invest across different sectors";
  } else {
    const maxWeight = Math.max(...holdings.map((h) => (h.market_value / totalValue) * 100));
    if (maxWeight > 30) {
      tip = "Reduce concentration in your top holding";
    }
  }

  return { score, tip };
}

function getColor(score: number) {
  if (score >= 70) return { ring: "text-emerald-400", bg: "text-emerald-400/20", label: "Good" };
  if (score >= 40) return { ring: "text-yellow-400", bg: "text-yellow-400/20", label: "Fair" };
  return { ring: "text-red-400", bg: "text-red-400/20", label: "Low" };
}

export default function DiversificationScore({
  holdings,
  totalValue,
}: {
  holdings: HoldingWithPrice[];
  totalValue: number;
}) {
  const { score, tip } = calculateScore(holdings, totalValue);
  const color = getColor(score);

  // SVG circle math
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-all hover:bg-white/[0.04]">
      <div className="flex items-center gap-5">
        {/* Ring */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="-rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-white/5"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={cn("transition-all duration-1000", color.ring)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-2xl font-bold", color.ring)}>{score}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</span>
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">Diversification</p>
          <p className={cn("text-lg font-bold", color.ring)}>{color.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{tip}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {Array.from(new Set(holdings.map((h) => getSector(h.symbol)))).map((sector) => (
              <span
                key={sector}
                className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-muted-foreground"
              >
                {sector}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
