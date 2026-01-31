package services

import (
	"context"
	"log"
	"sort"
	"time"

	dbsqlc "paperstack/db/sqlc"
	"paperstack/models"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// SnapshotService manages periodic portfolio snapshots.
type SnapshotService struct {
	queries  *dbsqlc.Queries
	stockSvc StockQuoteProvider
}

func NewSnapshotService(q *dbsqlc.Queries, stockSvc StockQuoteProvider) *SnapshotService {
	return &SnapshotService{queries: q, stockSvc: stockSvc}
}

// TakeSnapshot records today's snapshot for a single portfolio, upserting if it already exists.
func (s *SnapshotService) TakeSnapshot(ctx context.Context, portfolioID uuid.UUID) (models.PortfolioSnapshot, error) {
	portfolio, err := getPortfolioByID(ctx, s.queries, portfolioID)
	if err != nil {
		return models.PortfolioSnapshot{}, err
	}

	totalValue, err := computePortfolioValue(ctx, s.queries, s.stockSvc, portfolio)
	if err != nil {
		return models.PortfolioSnapshot{}, err
	}

	totalValueStr := totalValue.StringFixed(2)
	snapDate := time.Now().UTC().Truncate(24 * time.Hour)

	snapshot, err := s.queries.CreateSnapshot(ctx, dbsqlc.CreateSnapshotParams{
		PortfolioID:  portfolioID,
		TotalValue:   totalValueStr,
		CashBalance:  portfolio.CashBalance,
		SnapshotDate: snapDate,
	})
	if err != nil {
		return models.PortfolioSnapshot{}, err
	}

	totalValueDec, _ := decimal.NewFromString(snapshot.TotalValue)
	cashDec, _ := decimal.NewFromString(snapshot.CashBalance)

	return models.PortfolioSnapshot{
		ID:           snapshot.ID.String(),
		PortfolioID:  snapshot.PortfolioID.String(),
		TotalValue:   totalValueDec.InexactFloat64(),
		CashBalance:  cashDec.InexactFloat64(),
		SnapshotDate: snapshot.SnapshotDate,
		CreatedAt:    snapshot.CreatedAt,
	}, nil
}

// TakeAllSnapshots iterates all portfolios and records their current value.
func (s *SnapshotService) TakeAllSnapshots(ctx context.Context) {
	portfolios, err := s.queries.GetAllPortfolios(ctx)
	if err != nil {
		log.Printf("snapshot job: failed to fetch portfolios: %v", err)
		return
	}

	for _, p := range portfolios {
		if _, err := s.TakeSnapshot(ctx, p.ID); err != nil {
			log.Printf("snapshot job: portfolio %s failed: %v", p.ID, err)
		}
	}
}

// GetPortfolioHistory returns snapshots for the given period.
func (s *SnapshotService) GetPortfolioHistory(ctx context.Context, portfolioID uuid.UUID, period string) (models.PortfolioHistoryResponse, error) {
	portfolio, err := getPortfolioByID(ctx, s.queries, portfolioID)
	if err != nil {
		return models.PortfolioHistoryResponse{}, err
	}

	var snapshots []dbsqlc.PortfolioSnapshot

	switch period {
	case "ALL":
		snapshots, err = s.queries.GetSnapshotsByPortfolioID(ctx, portfolioID)
	default:
		start := calculateStartDate(period)
		if start.IsZero() {
			snapshots, err = s.queries.GetSnapshotsByPortfolioID(ctx, portfolioID)
		} else {
			snapshots, err = s.queries.GetSnapshotsInRange(ctx, dbsqlc.GetSnapshotsInRangeParams{
				PortfolioID:    portfolioID,
				SnapshotDate:   start,
				SnapshotDate_2: time.Now().UTC(),
			})
		}
	}

	if err != nil {
		return models.PortfolioHistoryResponse{}, err
	}

	points := make([]models.SnapshotPoint, 0, len(snapshots))
	for _, sSnap := range snapshots {
		valueDec, _ := decimal.NewFromString(sSnap.TotalValue)
		points = append(points, models.SnapshotPoint{
			Date:       sSnap.SnapshotDate,
			TotalValue: valueDec.InexactFloat64(),
		})
	}

	if len(points) >= 2 {
		return models.PortfolioHistoryResponse{Points: points}, nil
	}

	// Fallback: build history from live price candles when no snapshots exist yet.
	if s.stockSvc != nil {
		if livePoints, err := s.buildHistoryFromPrices(ctx, portfolio, period); err == nil && len(livePoints) > 0 {
			return models.PortfolioHistoryResponse{Points: livePoints}, nil
		}
	}

	// As a last resort, at least return a single up-to-date point so the chart isn't empty.
	if s.stockSvc != nil {
		if currentValue, err := computePortfolioValue(ctx, s.queries, s.stockSvc, portfolio); err == nil {
			now := time.Now().UTC()
			if len(points) == 0 || now.After(points[len(points)-1].Date) {
				points = append(points, models.SnapshotPoint{
					Date:       now,
					TotalValue: currentValue.InexactFloat64(),
				})
			} else {
				points[len(points)-1].TotalValue = currentValue.InexactFloat64()
				points[len(points)-1].Date = now
			}
		}
	}

	return models.PortfolioHistoryResponse{Points: points}, nil
}

func calculateStartDate(period string) time.Time {
	now := time.Now().UTC()
	switch period {
	case "1W":
		return now.AddDate(0, 0, -7)
	case "1M":
		return now.AddDate(0, -1, 0)
	case "3M":
		return now.AddDate(0, -3, 0)
	case "1Y":
		return now.AddDate(-1, 0, 0)
	case "ALL":
		return time.Time{}
	default:
		return time.Time{}
	}
}

// buildHistoryFromPrices synthesizes portfolio history using candle data for each holding.
func (s *SnapshotService) buildHistoryFromPrices(ctx context.Context, portfolio dbsqlc.Portfolio, period string) ([]models.SnapshotPoint, error) {
	holdings, err := s.queries.GetHoldingsByPortfolioID(ctx, portfolio.ID)
	if err != nil {
		return nil, err
	}
	if len(holdings) == 0 || s.stockSvc == nil {
		return nil, nil
	}

	cashDec, err := decimal.NewFromString(portfolio.CashBalance)
	if err != nil {
		return nil, err
	}

	normalizedPeriod := period
	if normalizedPeriod == "ALL" {
		normalizedPeriod = "1Y"
	}

	valueByTimestamp := make(map[int64]decimal.Decimal)

	for _, h := range holdings {
		sharesDec, err := decimal.NewFromString(h.Shares)
		if err != nil {
			return nil, err
		}

		history, err := s.stockSvc.GetHistoricalPrices(ctx, h.Symbol, normalizedPeriod)
		if err != nil {
			log.Printf("history fallback: failed to fetch %s history: %v", h.Symbol, err)
			continue
		}

		for _, candle := range history.History {
			ts := candle.Date.Truncate(time.Hour).Unix()
			pointValue := decimal.NewFromFloat(candle.Close).Mul(sharesDec)
			valueByTimestamp[ts] = valueByTimestamp[ts].Add(pointValue)
		}
	}

	if len(valueByTimestamp) == 0 {
		return nil, nil
	}

	points := make([]models.SnapshotPoint, 0, len(valueByTimestamp)+1)
	for ts, holdingsValue := range valueByTimestamp {
		total := holdingsValue.Add(cashDec)
		points = append(points, models.SnapshotPoint{
			Date:       time.Unix(ts, 0).UTC(),
			TotalValue: total.InexactFloat64(),
		})
	}

	// Ensure we include the most recent live value so the chart ends at "now".
	if currentValue, err := computePortfolioValue(ctx, s.queries, s.stockSvc, portfolio); err == nil {
		points = append(points, models.SnapshotPoint{
			Date:       time.Now().UTC(),
			TotalValue: currentValue.InexactFloat64(),
		})
	}

	sort.Slice(points, func(i, j int) bool {
		return points[i].Date.Before(points[j].Date)
	})

	return points, nil
}
