package services

import (
	"context"
	"database/sql"
	"errors"
	"time"

	dbsqlc "paperstack/db/sqlc"
	"paperstack/models"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

const startingCapital = 100000.00

// StockQuoteProvider supplies quotes for pricing.
type StockQuoteProvider interface {
	GetQuoteWithCache(ctx context.Context, symbol string) (models.StockQuote, error)
	GetHistoricalPrices(ctx context.Context, symbol, period string) (models.StockHistoryResponse, error)
}

// GetPortfolioWithHoldings builds a portfolio response with live prices and aggregates.
func GetPortfolioWithHoldings(ctx context.Context, q *dbsqlc.Queries, stockSvc StockQuoteProvider, userID uuid.UUID) (models.PortfolioResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	portfolio, err := q.GetPortfolioByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return models.PortfolioResponse{}, sql.ErrNoRows
		}
		return models.PortfolioResponse{}, err
	}

	holdings, err := q.GetHoldingsByPortfolioID(ctx, portfolio.ID)
	if err != nil {
		return models.PortfolioResponse{}, err
	}

	cashDecimal, err := decimal.NewFromString(portfolio.CashBalance)
	if err != nil {
		return models.PortfolioResponse{}, err
	}

	totalHoldings := decimal.NewFromInt(0)
	var holdingViews []models.HoldingWithPrice

	for _, h := range holdings {
		sharesDec, err := decimal.NewFromString(h.Shares)
		if err != nil {
			return models.PortfolioResponse{}, err
		}
		avgCostDec, err := decimal.NewFromString(h.AverageCost)
		if err != nil {
			return models.PortfolioResponse{}, err
		}

		price := avgCostDec
		if stockSvc != nil {
			if quote, err := stockSvc.GetQuoteWithCache(ctx, h.Symbol); err == nil && quote.Price > 0 {
				price = decimal.NewFromFloat(quote.Price)
			}
			// On API errors or zero price, gracefully fall back to average cost so the portfolio still loads.
		}

		marketValue := CalculateMarketValue(sharesDec, price)
		gain, gainPct := CalculateGainLoss(sharesDec, avgCostDec, price)

		totalHoldings = totalHoldings.Add(marketValue)

		holdingViews = append(holdingViews, models.HoldingWithPrice{
			ID:              h.ID.String(),
			Symbol:          h.Symbol,
			Shares:          toFloat(sharesDec),
			AverageCost:     toFloat(avgCostDec),
			CurrentPrice:    toFloat(price),
			MarketValue:     toFloat(marketValue),
			GainLoss:        toFloat(gain),
			GainLossPercent: toFloat(gainPct),
		})
	}

	totalValue := cashDecimal.Add(totalHoldings)
	totalReturn := totalValue.Sub(decimal.NewFromFloat(startingCapital))
	totalReturnPct := CalculateReturnPercent(totalValue, decimal.NewFromFloat(startingCapital))

	return models.PortfolioResponse{
		ID:                 portfolio.ID.String(),
		CashBalance:        toFloat(cashDecimal),
		TotalValue:         toFloat(totalValue),
		TotalReturn:        toFloat(totalReturn),
		TotalReturnPercent: toFloat(totalReturnPct),
		Holdings:           holdingViews,
	}, nil
}

func CalculateMarketValue(shares, price decimal.Decimal) decimal.Decimal {
	return shares.Mul(price)
}

func CalculateGainLoss(shares, averageCost, currentPrice decimal.Decimal) (decimal.Decimal, decimal.Decimal) {
	costBasis := shares.Mul(averageCost)
	marketValue := shares.Mul(currentPrice)
	gain := marketValue.Sub(costBasis)

	percent := decimal.NewFromInt(0)
	if !costBasis.IsZero() {
		percent = gain.Div(costBasis).Mul(decimal.NewFromInt(100))
	}

	return gain, percent
}

func CalculateReturnPercent(currentValue, startingValue decimal.Decimal) decimal.Decimal {
	if startingValue.IsZero() {
		return decimal.Zero
	}
	return currentValue.Sub(startingValue).Div(startingValue).Mul(decimal.NewFromInt(100))
}

func toFloat(d decimal.Decimal) float64 {
	f, _ := d.Float64()
	return f
}
