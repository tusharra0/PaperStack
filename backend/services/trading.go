package services

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	dbsqlc "paperstack/db/sqlc"
	"paperstack/models"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

var (
	ErrInsufficientFunds  = errors.New("insufficient funds")
	ErrInsufficientShares = errors.New("insufficient shares")
	ErrInvalidSymbol      = errors.New("invalid symbol")
)

type TradingService struct {
	queries  *dbsqlc.Queries
	stockSvc *StockService
	db       *sql.DB
}

func NewTradingService(db *sql.DB, q *dbsqlc.Queries, stockSvc *StockService) *TradingService {
	return &TradingService{
		db:       db,
		queries:  q,
		stockSvc: stockSvc,
	}
}

type validatedTrade struct {
	Symbol string
	Type   string
	Shares decimal.Decimal
	Price  decimal.Decimal
}

func (t *TradingService) ValidateTrade(ctx context.Context, userID uuid.UUID, req models.TradeRequest) (validatedTrade, error) {
	req.Symbol = strings.ToUpper(strings.TrimSpace(req.Symbol))
	if req.Symbol == "" {
		return validatedTrade{}, ErrInvalidSymbol
	}
	if req.Shares <= 0 {
		return validatedTrade{}, errors.New("shares must be positive")
	}

	quote, err := t.stockSvc.GetQuoteWithCache(ctx, req.Symbol)
	if err != nil || quote.Price <= 0 {
		return validatedTrade{}, ErrInvalidSymbol
	}

	price := decimal.NewFromFloat(quote.Price)
	shares := decimal.NewFromFloat(req.Shares)

	txData := validatedTrade{
		Symbol: req.Symbol,
		Type:   strings.ToUpper(req.Type),
		Shares: shares,
		Price:  price,
	}

	// Only enforce cash/holdings checks here.
	portfolio, err := t.queries.GetPortfolioByUserID(ctx, userID)
	if err != nil {
		return validatedTrade{}, err
	}
	cash, _ := decimal.NewFromString(portfolio.CashBalance)

	switch txData.Type {
	case "BUY":
		totalCost := price.Mul(shares)
		if cash.LessThan(totalCost) {
			return validatedTrade{}, ErrInsufficientFunds
		}
	case "SELL":
		holding, err := t.queries.GetHoldingBySymbol(ctx, dbsqlc.GetHoldingBySymbolParams{
			PortfolioID: portfolio.ID,
			Symbol:      txData.Symbol,
		})
		if err == sql.ErrNoRows {
			return validatedTrade{}, ErrInsufficientShares
		} else if err != nil {
			return validatedTrade{}, err
		}
		ownedShares, _ := decimal.NewFromString(holding.Shares)
		if ownedShares.LessThan(shares) {
			return validatedTrade{}, ErrInsufficientShares
		}
	default:
		return validatedTrade{}, errors.New("type must be BUY or SELL")
	}

	return txData, nil
}

func (t *TradingService) ExecuteTrade(ctx context.Context, userID uuid.UUID, req models.TradeRequest) (models.TradeResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	valid, err := t.ValidateTrade(ctx, userID, req)
	if err != nil {
		return models.TradeResponse{}, err
	}

	tx, err := t.db.BeginTx(ctx, nil)
	if err != nil {
		return models.TradeResponse{}, err
	}

	qtx := t.queries.WithTx(tx)

	portfolio, err := qtx.GetPortfolioByUserID(ctx, userID)
	if err != nil {
		tx.Rollback()
		return models.TradeResponse{}, err
	}
	cash, _ := decimal.NewFromString(portfolio.CashBalance)

	var txn dbsqlc.Transaction

	switch valid.Type {
	case "BUY":
		totalCost := valid.Price.Mul(valid.Shares)
		cash = cash.Sub(totalCost)

		if err := t.updateHoldingBuy(ctx, qtx, portfolio.ID, valid); err != nil {
			tx.Rollback()
			return models.TradeResponse{}, err
		}

		portfolio, err = qtx.UpdateCashBalance(ctx, dbsqlc.UpdateCashBalanceParams{
			ID:          portfolio.ID,
			CashBalance: cash.StringFixed(2),
		})
		if err != nil {
			tx.Rollback()
			return models.TradeResponse{}, err
		}

		txn, err = qtx.CreateTransaction(ctx, dbsqlc.CreateTransactionParams{
			PortfolioID:   portfolio.ID,
			Symbol:        valid.Symbol,
			Type:          "BUY",
			Shares:        valid.Shares.String(),
			PricePerShare: valid.Price.StringFixed(2),
			TotalAmount:   totalCost.StringFixed(2),
		})
		if err != nil {
			tx.Rollback()
			return models.TradeResponse{}, err
		}

	case "SELL":
		totalProceeds := valid.Price.Mul(valid.Shares)
		cash = cash.Add(totalProceeds)

		if err := t.updateHoldingSell(ctx, qtx, portfolio.ID, valid); err != nil {
			tx.Rollback()
			return models.TradeResponse{}, err
		}

		portfolio, err = qtx.UpdateCashBalance(ctx, dbsqlc.UpdateCashBalanceParams{
			ID:          portfolio.ID,
			CashBalance: cash.StringFixed(2),
		})
		if err != nil {
			tx.Rollback()
			return models.TradeResponse{}, err
		}

		txn, err = qtx.CreateTransaction(ctx, dbsqlc.CreateTransactionParams{
			PortfolioID:   portfolio.ID,
			Symbol:        valid.Symbol,
			Type:          "SELL",
			Shares:        valid.Shares.String(),
			PricePerShare: valid.Price.StringFixed(2),
			TotalAmount:   totalProceeds.StringFixed(2),
		})
		if err != nil {
			tx.Rollback()
			return models.TradeResponse{}, err
		}
	}

	if err := tx.Commit(); err != nil {
		return models.TradeResponse{}, err
	}

	// Refresh portfolio view
	respPortfolio, err := GetPortfolioWithHoldings(ctx, t.queries, t.stockSvc, userID)
	if err != nil {
		return models.TradeResponse{}, err
	}

	return models.TradeResponse{
		Transaction: ToTransactionModel(txn),
		Portfolio:   respPortfolio,
	}, nil
}

func (t *TradingService) updateHoldingBuy(ctx context.Context, q *dbsqlc.Queries, portfolioID uuid.UUID, trade validatedTrade) error {
	h, err := q.GetHoldingBySymbol(ctx, dbsqlc.GetHoldingBySymbolParams{
		PortfolioID: portfolioID,
		Symbol:      trade.Symbol,
	})
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	if err == sql.ErrNoRows {
		_, err := q.CreateHolding(ctx, dbsqlc.CreateHoldingParams{
			PortfolioID: portfolioID,
			Symbol:      trade.Symbol,
			Shares:      trade.Shares.String(),
			AverageCost: trade.Price.StringFixed(2),
		})
		return err
	}

	oldShares, _ := decimal.NewFromString(h.Shares)
	oldAvg, _ := decimal.NewFromString(h.AverageCost)

	totalShares := oldShares.Add(trade.Shares)
	newAvg := oldShares.Mul(oldAvg).Add(trade.Shares.Mul(trade.Price)).Div(totalShares)

	_, err = q.UpdateHolding(ctx, dbsqlc.UpdateHoldingParams{
		PortfolioID: portfolioID,
		Symbol:      trade.Symbol,
		Shares:      totalShares.String(),
		AverageCost: newAvg.StringFixed(2),
	})
	return err
}

func (t *TradingService) updateHoldingSell(ctx context.Context, q *dbsqlc.Queries, portfolioID uuid.UUID, trade validatedTrade) error {
	h, err := q.GetHoldingBySymbol(ctx, dbsqlc.GetHoldingBySymbolParams{
		PortfolioID: portfolioID,
		Symbol:      trade.Symbol,
	})
	if err != nil {
		return err
	}

	shares, _ := decimal.NewFromString(h.Shares)
	remaining := shares.Sub(trade.Shares)

	if remaining.IsZero() || remaining.IsNegative() {
		return q.DeleteHolding(ctx, dbsqlc.DeleteHoldingParams{
			PortfolioID: portfolioID,
			Symbol:      trade.Symbol,
		})
	}

	_, err = q.UpdateHolding(ctx, dbsqlc.UpdateHoldingParams{
		PortfolioID: portfolioID,
		Symbol:      trade.Symbol,
		Shares:      remaining.String(),
		AverageCost: h.AverageCost,
	})
	return err
}

func ToTransactionModel(t dbsqlc.Transaction) models.Transaction {
	return models.Transaction{
		ID:            t.ID.String(),
		PortfolioID:   t.PortfolioID.String(),
		Symbol:        t.Symbol,
		Type:          t.Type,
		Shares:        toFloat(decimal.RequireFromString(t.Shares)),
		PricePerShare: toFloat(decimal.RequireFromString(t.PricePerShare)),
		TotalAmount:   toFloat(decimal.RequireFromString(t.TotalAmount)),
		CreatedAt:     t.CreatedAt,
	}
}
