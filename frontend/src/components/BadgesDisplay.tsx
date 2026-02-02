"use client";

import { useEffect, useState } from "react";
import { getBadges, checkBadges } from "@/lib/api";
import type { UserBadge } from "@/types";
import { cn } from "@/lib/utils";

const BADGE_ICONS: Record<string, React.ReactNode> = {
  rocket: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  ),
  "pie-chart": (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
    </svg>
  ),
  gem: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V15m0 0l-2.25-1.313M3 16.5V12m0 0l2.25 1.313M21 16.5V12m0 0l-2.25 1.313m-13.5 0L3 16.5m4.5-3.187l2.25 1.313m0 0V18m-4.5-3.187V18m0-6.75l4.5 2.625" />
    </svg>
  ),
  "trending-up": (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
  trophy: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
    </svg>
  ),
  refresh: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
    </svg>
  ),
};

// All possible badges for showing locked state
const ALL_BADGE_IDS = ["first_trade", "diversified", "diamond_hands", "green_day", "top_10", "comeback"];
const BADGE_META: Record<string, { name: string; description: string; icon: string }> = {
  first_trade: { name: "First Trade", description: "Made your first trade", icon: "rocket" },
  diversified: { name: "Diversified", description: "Own 5+ different stocks", icon: "pie-chart" },
  diamond_hands: { name: "Diamond Hands", description: "Held a stock for 7+ days", icon: "gem" },
  green_day: { name: "Green Day", description: "Portfolio up 3%+ in one day", icon: "trending-up" },
  top_10: { name: "Top 10", description: "Reached top 10 on leaderboard", icon: "trophy" },
  comeback: { name: "Comeback Kid", description: "Recovered from a 10% loss", icon: "refresh" },
};

function BadgePopup({ badge, onClose }: { badge: UserBadge; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-black/90 px-5 py-4 shadow-2xl shadow-primary/20 backdrop-blur-xl">
        <div className="rounded-xl bg-primary/20 p-3 text-primary">
          {BADGE_ICONS[badge.icon] || BADGE_ICONS.rocket}
        </div>
        <div>
          <p className="text-xs font-medium text-primary">Achievement Unlocked!</p>
          <p className="font-bold">{badge.name}</p>
          <p className="text-sm text-muted-foreground">{badge.description}</p>
        </div>
        <button onClick={onClose} className="ml-2 text-muted-foreground hover:text-foreground">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function BadgesDisplay({ triggerCheck }: { triggerCheck?: number }) {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [newBadge, setNewBadge] = useState<UserBadge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getBadges();
        setBadges(res.badges);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Check for new badges when triggerCheck changes
  useEffect(() => {
    if (triggerCheck === undefined || triggerCheck === 0) return;
    const check = async () => {
      try {
        const res = await checkBadges();
        if (res.new_badges && res.new_badges.length > 0) {
          setBadges((prev) => [...res.new_badges, ...prev]);
          setNewBadge(res.new_badges[0]);
        }
      } catch {
        // silent fail
      }
    };
    check();
  }, [triggerCheck]);

  if (loading) return null;

  const earnedIds = new Set(badges.map((b) => b.badge_id));

  return (
    <>
      {newBadge && <BadgePopup badge={newBadge} onClose={() => setNewBadge(null)} />}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Achievements</h2>
          <span className="text-sm text-muted-foreground">
            {badges.length}/{ALL_BADGE_IDS.length}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_BADGE_IDS.map((id) => {
            const earned = earnedIds.has(id);
            const meta = BADGE_META[id];
            return (
              <div
                key={id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 transition-all",
                  earned
                    ? "border-primary/20 bg-primary/[0.03]"
                    : "border-white/5 bg-white/[0.01] opacity-40"
                )}
              >
                <div
                  className={cn(
                    "rounded-xl p-2.5",
                    earned ? "bg-primary/10 text-primary" : "bg-white/5 text-muted-foreground"
                  )}
                >
                  {BADGE_ICONS[meta.icon] || BADGE_ICONS.rocket}
                </div>
                <div className="min-w-0">
                  <p className={cn("font-medium", !earned && "text-muted-foreground")}>
                    {meta.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                </div>
                {earned && (
                  <svg className="ml-auto h-5 w-5 flex-shrink-0 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
