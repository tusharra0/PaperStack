package services

import (
	"context"
	"log"
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
	var snapshots []dbsqlc.PortfolioSnapshot
	var err error

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
