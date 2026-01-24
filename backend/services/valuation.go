package services

import (
	"context"
	"time"

	dbsqlc "paperstack/db/sqlc"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// computePortfolioValue returns the total portfolio value (cash + holdings market value).
// It falls back to average cost when live quotes are unavailable to keep the experience resilient.
func computePortfolioValue(ctx context.Context, q *dbsqlc.Queries, stockSvc StockQuoteProvider, portfolio dbsqlc.Portfolio) (decimal.Decimal, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	cash, err := decimal.NewFromString(portfolio.CashBalance)
	if err != nil {
		return decimal.Zero, err
	}

	holdings, err := q.GetHoldingsByPortfolioID(ctx, portfolio.ID)
	if err != nil {
		return decimal.Zero, err
	}

	totalHoldings := decimal.Zero
	for _, h := range holdings {
		shares, err := decimal.NewFromString(h.Shares)
		if err != nil {
			return decimal.Zero, err
		}

		priceDec := decimal.Zero
		if stockSvc != nil {
			if quote, err := stockSvc.GetQuoteWithCache(ctx, h.Symbol); err == nil && quote.Price > 0 {
				priceDec = decimal.NewFromFloat(quote.Price)
			}
		}
		if priceDec.IsZero() {
			// Gracefully degrade to average cost if live quote is missing.
			priceDec, err = decimal.NewFromString(h.AverageCost)
			if err != nil {
				return decimal.Zero, err
			}
		}

		totalHoldings = totalHoldings.Add(shares.Mul(priceDec))
	}

	return cash.Add(totalHoldings), nil
}

// helper to fetch a portfolio by ID; kept here to co-locate value calculations.
func getPortfolioByID(ctx context.Context, q *dbsqlc.Queries, portfolioID uuid.UUID) (dbsqlc.Portfolio, error) {
	return q.GetPortfolioByID(ctx, portfolioID)
}
