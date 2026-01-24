package services

import (
	"context"
	"sort"
	"sync"
	"time"

	dbsqlc "paperstack/db/sqlc"
	"paperstack/models"

	"github.com/shopspring/decimal"
)

const leaderboardCacheTTL = 5 * time.Minute

// LeaderboardService calculates and caches portfolio rankings.
type LeaderboardService struct {
	queries  *dbsqlc.Queries
	stockSvc StockQuoteProvider

	cacheMu       sync.RWMutex
	cachedEntries []models.LeaderboardEntry
	cachedRanks   map[string]int
	cachedAt      time.Time
}

func NewLeaderboardService(q *dbsqlc.Queries, stockSvc StockQuoteProvider) *LeaderboardService {
	return &LeaderboardService{queries: q, stockSvc: stockSvc}
}

// GetLeaderboard recomputes the leaderboard and returns the top N entries.
func (s *LeaderboardService) GetLeaderboard(ctx context.Context, limit int) ([]models.LeaderboardEntry, error) {
	entries, ranks, err := s.buildLeaderboard(ctx)
	if err != nil {
		return nil, err
	}
	s.CacheLeaderboard(entries, ranks)
	return s.limit(entries, limit), nil
}

// CacheLeaderboard stores the computed rankings in memory (placeholder for Redis sorted set).
func (s *LeaderboardService) CacheLeaderboard(entries []models.LeaderboardEntry, ranks map[string]int) {
	s.cacheMu.Lock()
	defer s.cacheMu.Unlock()
	s.cachedEntries = make([]models.LeaderboardEntry, len(entries))
	copy(s.cachedEntries, entries)
	s.cachedRanks = make(map[string]int, len(ranks))
	for k, v := range ranks {
		s.cachedRanks[k] = v
	}
	s.cachedAt = time.Now()
}

// GetCachedLeaderboard returns cached rankings if available.
func (s *LeaderboardService) GetCachedLeaderboard(limit int) ([]models.LeaderboardEntry, map[string]int, time.Time) {
	s.cacheMu.RLock()
	defer s.cacheMu.RUnlock()
	if len(s.cachedEntries) == 0 {
		return nil, nil, time.Time{}
	}
	entries := s.limit(s.cachedEntries, limit)
	cp := make([]models.LeaderboardEntry, len(entries))
	copy(cp, entries)
	ranksCopy := make(map[string]int, len(s.cachedRanks))
	for k, v := range s.cachedRanks {
		ranksCopy[k] = v
	}
	return cp, ranksCopy, s.cachedAt
}

// RefreshLeaderboard recalculates rankings and updates the cache.
func (s *LeaderboardService) RefreshLeaderboard(ctx context.Context) error {
	entries, ranks, err := s.buildLeaderboard(ctx)
	if err != nil {
		return err
	}
	s.CacheLeaderboard(entries, ranks)
	return nil
}

// GetLeaderboardResponse returns cached data when fresh, otherwise rebuilds.
func (s *LeaderboardService) GetLeaderboardResponse(ctx context.Context, limit int, currentUserID string) (models.LeaderboardResponse, error) {
	entries, ranks, cachedAt := s.GetCachedLeaderboard(0)
	if len(entries) == 0 || time.Since(cachedAt) > leaderboardCacheTTL {
		if err := s.RefreshLeaderboard(ctx); err != nil {
			return models.LeaderboardResponse{}, err
		}
		entries, ranks, _ = s.GetCachedLeaderboard(0)
	}

	top := s.limit(entries, limit)
	var userRank *int
	if currentUserID != "" {
		if rank, ok := ranks[currentUserID]; ok {
			userRank = &rank
		}
	}

	return models.LeaderboardResponse{
		Entries:         top,
		CurrentUserRank: userRank,
	}, nil
}

// buildLeaderboard calculates rankings for all portfolios.
func (s *LeaderboardService) buildLeaderboard(ctx context.Context) ([]models.LeaderboardEntry, map[string]int, error) {
	rows, err := s.queries.GetAllPortfoliosWithUsers(ctx)
	if err != nil {
		return nil, nil, err
	}

	type entryWithID struct {
		entry  models.LeaderboardEntry
		userID string
	}

	items := make([]entryWithID, 0, len(rows))

	for _, row := range rows {
		portfolio := dbsqlc.Portfolio{
			ID:          row.ID,
			UserID:      row.UserID,
			CashBalance: row.CashBalance,
			CreatedAt:   row.CreatedAt,
			UpdatedAt:   row.UpdatedAt,
		}

		totalValue, err := computePortfolioValue(ctx, s.queries, s.stockSvc, portfolio)
		if err != nil {
			return nil, nil, err
		}

		totalReturnPct := totalValue.Sub(decimal.NewFromFloat(startingCapital)).Div(decimal.NewFromFloat(startingCapital)).Mul(decimal.NewFromInt(100))

		totalValueFloat, _ := totalValue.Float64()
		items = append(items, entryWithID{
			entry: models.LeaderboardEntry{
				Username:           row.Username,
				TotalReturnPercent: totalReturnPct.InexactFloat64(),
				TotalValue:         totalValueFloat,
			},
			userID: row.UserID.String(),
		})
	}

	sort.Slice(items, func(i, j int) bool {
		if items[i].entry.TotalReturnPercent == items[j].entry.TotalReturnPercent {
			return items[i].entry.Username < items[j].entry.Username
		}
		return items[i].entry.TotalReturnPercent > items[j].entry.TotalReturnPercent
	})

	entries := make([]models.LeaderboardEntry, len(items))
	ranks := make(map[string]int, len(items))
	for i, item := range items {
		item.entry.Rank = i + 1
		entries[i] = item.entry
		ranks[item.userID] = i + 1
	}

	return entries, ranks, nil
}

func (s *LeaderboardService) limit(entries []models.LeaderboardEntry, limit int) []models.LeaderboardEntry {
	if limit <= 0 || limit > len(entries) {
		limit = len(entries)
	}
	return entries[:limit]
}
