package services

import (
	"context"
	"database/sql"
	"log"
	"time"

	dbsqlc "paperstack/db/sqlc"
	"paperstack/models"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type BadgeService struct {
	queries  *dbsqlc.Queries
	stockSvc *StockService
}

func NewBadgeService(q *dbsqlc.Queries, stockSvc *StockService) *BadgeService {
	return &BadgeService{queries: q, stockSvc: stockSvc}
}

// CheckAndAwardBadges checks all badge conditions for a user and awards new ones.
// Returns any newly awarded badges.
func (s *BadgeService) CheckAndAwardBadges(ctx context.Context, userID uuid.UUID) []models.UserBadgeResponse {
	var newBadges []models.UserBadgeResponse

	portfolio, err := s.queries.GetPortfolioByUserID(ctx, userID)
	if err != nil {
		return newBadges
	}

	holdings, err := s.queries.GetHoldingsByPortfolioID(ctx, portfolio.ID)
	if err != nil {
		return newBadges
	}

	// Check "first_trade"
	txns, err := s.queries.GetTransactionsByPortfolioID(ctx, dbsqlc.GetTransactionsByPortfolioIDParams{
		PortfolioID: portfolio.ID,
		Limit:       1,
		Offset:      0,
	})
	if err == nil && len(txns) > 0 {
		if b := s.tryAward(ctx, userID, "first_trade"); b != nil {
			newBadges = append(newBadges, *b)
		}
	}

	// Check "diversified" - 5+ different stocks
	if len(holdings) >= 5 {
		if b := s.tryAward(ctx, userID, "diversified"); b != nil {
			newBadges = append(newBadges, *b)
		}
	}

	// Check "diamond_hands" - held any stock 7+ days
	for _, h := range holdings {
		if time.Since(h.CreatedAt) >= 7*24*time.Hour {
			if b := s.tryAward(ctx, userID, "diamond_hands"); b != nil {
				newBadges = append(newBadges, *b)
			}
			break
		}
	}

	// Check "green_day" - portfolio up 3%+
	cashDec, _ := decimal.NewFromString(portfolio.CashBalance)
	totalHoldings := decimal.Zero
	for _, h := range holdings {
		shares, _ := decimal.NewFromString(h.Shares)
		avgCost, _ := decimal.NewFromString(h.AverageCost)
		price := avgCost
		if s.stockSvc != nil {
			if quote, err := s.stockSvc.GetQuoteWithCache(ctx, h.Symbol); err == nil && quote.Price > 0 {
				price = decimal.NewFromFloat(quote.Price)
			}
		}
		totalHoldings = totalHoldings.Add(shares.Mul(price))
	}
	totalValue := cashDec.Add(totalHoldings)
	startCap := decimal.NewFromFloat(100000)
	returnPct := decimal.Zero
	if !startCap.IsZero() {
		returnPct = totalValue.Sub(startCap).Div(startCap).Mul(decimal.NewFromInt(100))
	}
	if returnPct.GreaterThanOrEqual(decimal.NewFromInt(3)) {
		if b := s.tryAward(ctx, userID, "green_day"); b != nil {
			newBadges = append(newBadges, *b)
		}
	}

	// Check "comeback" - recovered from 10% loss (check snapshot history)
	snapshots, err := s.queries.GetSnapshotsByPortfolioID(ctx, portfolio.ID)
	if err == nil && len(snapshots) >= 2 {
		hadBigLoss := false
		for _, snap := range snapshots {
			val, _ := decimal.NewFromString(snap.TotalValue)
			pct := val.Sub(startCap).Div(startCap).Mul(decimal.NewFromInt(100))
			if pct.LessThanOrEqual(decimal.NewFromInt(-10)) {
				hadBigLoss = true
			}
		}
		if hadBigLoss && returnPct.GreaterThanOrEqual(decimal.Zero) {
			if b := s.tryAward(ctx, userID, "comeback"); b != nil {
				newBadges = append(newBadges, *b)
			}
		}
	}

	return newBadges
}

// CheckTop10Badge checks if user is in top 10 and awards badge.
func (s *BadgeService) CheckTop10Badge(ctx context.Context, userID uuid.UUID, rank int) []models.UserBadgeResponse {
	var newBadges []models.UserBadgeResponse
	if rank > 0 && rank <= 10 {
		if b := s.tryAward(ctx, userID, "top_10"); b != nil {
			newBadges = append(newBadges, *b)
		}
	}
	return newBadges
}

func (s *BadgeService) tryAward(ctx context.Context, userID uuid.UUID, badgeID string) *models.UserBadgeResponse {
	badge, err := s.queries.AwardBadge(ctx, dbsqlc.AwardBadgeParams{
		UserID:  userID,
		BadgeID: badgeID,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			// Already awarded (ON CONFLICT DO NOTHING returns no rows)
			return nil
		}
		log.Printf("failed to award badge %s to %s: %v", badgeID, userID, err)
		return nil
	}

	def, ok := models.AllBadges[badgeID]
	if !ok {
		return nil
	}

	return &models.UserBadgeResponse{
		BadgeID:     badge.BadgeID,
		Name:        def.Name,
		Description: def.Description,
		Icon:        def.Icon,
		EarnedAt:    badge.EarnedAt,
	}
}

// GetUserBadges returns all badges for a user.
func (s *BadgeService) GetUserBadges(ctx context.Context, userID uuid.UUID) ([]models.UserBadgeResponse, error) {
	badges, err := s.queries.GetUserBadges(ctx, userID)
	if err != nil {
		return nil, err
	}

	result := make([]models.UserBadgeResponse, 0, len(badges))
	for _, b := range badges {
		def, ok := models.AllBadges[b.BadgeID]
		if !ok {
			continue
		}
		result = append(result, models.UserBadgeResponse{
			BadgeID:     b.BadgeID,
			Name:        def.Name,
			Description: def.Description,
			Icon:        def.Icon,
			EarnedAt:    b.EarnedAt,
		})
	}

	return result, nil
}
