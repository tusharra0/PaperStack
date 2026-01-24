package services

import (
	"context"
	"log"
	"time"
)

// StartJobs launches background routines for snapshots and leaderboard refresh.
func StartJobs(ctx context.Context, snapshotSvc *SnapshotService, leaderboardSvc *LeaderboardService) {
	go startLeaderboardRefresh(ctx, leaderboardSvc)
	go startDailySnapshots(ctx, snapshotSvc)
}

func startLeaderboardRefresh(ctx context.Context, lb *LeaderboardService) {
	// Warm cache on startup
	if err := lb.RefreshLeaderboard(context.Background()); err != nil {
		log.Printf("leaderboard refresh failed at startup: %v", err)
	}

	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := lb.RefreshLeaderboard(context.Background()); err != nil {
				log.Printf("leaderboard refresh error: %v", err)
			}
		}
	}
}

func startDailySnapshots(ctx context.Context, snapshotSvc *SnapshotService) {
	for {
		nextRun := nextMarketClose()
		delay := time.Until(nextRun)
		if delay < 0 {
			delay = time.Hour
		}
		timer := time.NewTimer(delay)
		select {
		case <-ctx.Done():
			timer.Stop()
			return
		case <-timer.C:
			snapshotSvc.TakeAllSnapshots(context.Background())
		}
	}
}

func nextMarketClose() time.Time {
	loc, err := time.LoadLocation("America/New_York")
	if err != nil {
		loc = time.FixedZone("EST", -5*3600)
	}
	now := time.Now().In(loc)
	next := time.Date(now.Year(), now.Month(), now.Day(), 16, 0, 0, 0, loc)
	if !next.After(now) {
		next = next.Add(24 * time.Hour)
	}
	return next
}
