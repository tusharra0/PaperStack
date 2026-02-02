package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	"paperstack/config"
	pdb "paperstack/db"
	dbsqlc "paperstack/db/sqlc"
	"paperstack/utils"

	"github.com/google/uuid"
)

// Seed a demo user with holdings, transactions, and recent snapshots so the UI
// has data for presentations. Safe to run multiple times; it will upsert/replace
// the demo portfolio data.
func main() {
	// Provide safe defaults so config.Load doesn't fail if these aren't set in local envs.
	if os.Getenv("STOCK_API_KEY") == "" {
		os.Setenv("STOCK_API_KEY", "demo-key")
	}
	if os.Getenv("JWT_SECRET") == "" {
		os.Setenv("JWT_SECRET", "demo-secret-change-me")
	}

	cfg := config.Load()

	db, err := pdb.ConnectPostgres(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("connect postgres: %v", err)
	}
	defer db.Close()

	queries := dbsqlc.New(db)
	ctx := context.Background()

	const (
		email    = "demo@paperstack.test"
		username = "demo_trader"
		password = "DemoPass123"
	)

	user, portfolio, err := ensureUserAndPortfolio(ctx, queries, email, username, password)
	if err != nil {
		log.Fatalf("ensure demo user: %v", err)
	}
	log.Printf("Demo user: %s (%s)", user.Username, user.Email)

	if err := resetPortfolioData(ctx, db, portfolio.ID); err != nil {
		log.Fatalf("reset portfolio data: %v", err)
	}

	if err := seedHoldings(ctx, queries, portfolio.ID); err != nil {
		log.Fatalf("seed holdings: %v", err)
	}
	if err := seedTransactions(ctx, queries, portfolio.ID); err != nil {
		log.Fatalf("seed transactions: %v", err)
	}
	if err := seedSnapshots(ctx, queries, portfolio.ID); err != nil {
		log.Fatalf("seed snapshots: %v", err)
	}

	if _, err := queries.UpdateCashBalance(ctx, dbsqlc.UpdateCashBalanceParams{
		ID:          portfolio.ID,
		CashBalance: "5074.90",
	}); err != nil {
		log.Fatalf("update cash balance: %v", err)
	}

	log.Println("Demo data ready. Login with email:", email, "password:", password)
}

func ensureUserAndPortfolio(ctx context.Context, q *dbsqlc.Queries, email, username, password string) (dbsqlc.User, dbsqlc.Portfolio, error) {
	user, err := q.GetUserByEmail(ctx, email)
	switch {
	case err == nil:
		// user exists, fetch portfolio
	case err == sql.ErrNoRows:
		hashed, hashErr := utils.HashPassword(password)
		if hashErr != nil {
			return dbsqlc.User{}, dbsqlc.Portfolio{}, hashErr
		}
		user, err = q.CreateUser(ctx, dbsqlc.CreateUserParams{
			Email:        email,
			PasswordHash: hashed,
			Username:     username,
		})
		if err != nil {
			return dbsqlc.User{}, dbsqlc.Portfolio{}, err
		}
	default:
		return dbsqlc.User{}, dbsqlc.Portfolio{}, err
	}

	portfolio, err := q.GetPortfolioByUserID(ctx, user.ID)
	if err == sql.ErrNoRows {
		portfolio, err = q.CreatePortfolio(ctx, dbsqlc.CreatePortfolioParams{
			UserID:      user.ID,
			CashBalance: "100000.00",
		})
	}
	return user, portfolio, err
}

// resetPortfolioData clears snapshots, holdings, and transactions for a clean seed.
func resetPortfolioData(ctx context.Context, db *sql.DB, portfolioID uuid.UUID) error {
	if _, err := db.ExecContext(ctx, "DELETE FROM portfolio_snapshots WHERE portfolio_id=$1", portfolioID); err != nil {
		return fmt.Errorf("delete snapshots: %w", err)
	}
	if _, err := db.ExecContext(ctx, "DELETE FROM transactions WHERE portfolio_id=$1", portfolioID); err != nil {
		return fmt.Errorf("delete transactions: %w", err)
	}
	if _, err := db.ExecContext(ctx, "DELETE FROM holdings WHERE portfolio_id=$1", portfolioID); err != nil {
		return fmt.Errorf("delete holdings: %w", err)
	}
	return nil
}

func seedHoldings(ctx context.Context, q *dbsqlc.Queries, portfolioID uuid.UUID) error {
	holdings := []struct {
		symbol string
		shares string
		avg    string
	}{
		{"AAPL", "40.000000", "248.04"},
		{"GOOGL", "55.000000", "335.66"},
		{"MDB", "120.000000", "398.69"},
		{"NVDA", "100.000000", "187.67"},
	}
	for _, h := range holdings {
		if _, err := q.CreateHolding(ctx, dbsqlc.CreateHoldingParams{
			PortfolioID: portfolioID,
			Symbol:      h.symbol,
			Shares:      h.shares,
			AverageCost: h.avg,
		}); err != nil {
			return err
		}
	}
	return nil
}

func seedTransactions(ctx context.Context, q *dbsqlc.Queries, portfolioID uuid.UUID) error {
	// Simple BUY history to populate the trade list.
	trades := []struct {
		symbol string
		shares string
		price  string
	}{
		{"NVDA", "100.000000", "187.67"},
		{"MDB", "120.000000", "398.69"},
		{"AAPL", "40.000000", "248.04"},
		{"GOOGL", "55.000000", "335.66"},
	}

	for _, t := range trades {
		total := toMoney(t.shares, t.price)
		if _, err := q.CreateTransaction(ctx, dbsqlc.CreateTransactionParams{
			PortfolioID:   portfolioID,
			Symbol:        t.symbol,
			Type:          "BUY",
			Shares:        t.shares,
			PricePerShare: t.price,
			TotalAmount:   total,
		}); err != nil {
			return err
		}
	}
	return nil
}

func seedSnapshots(ctx context.Context, q *dbsqlc.Queries, portfolioID uuid.UUID) error {
	// 8 days of values to make the 1W chart look alive.
	values := []float64{93000, 95500, 94800, 96500, 97200, 98000, 99400, 97719.85}
	cash := "5074.90"

	today := time.Now().UTC().Truncate(24 * time.Hour)
	for i, v := range values {
		day := today.AddDate(0, 0, -(len(values) - i - 1))
		if _, err := q.CreateSnapshot(ctx, dbsqlc.CreateSnapshotParams{
			PortfolioID:  portfolioID,
			TotalValue:   fmt.Sprintf("%.2f", v),
			CashBalance:  cash,
			SnapshotDate: day,
		}); err != nil {
			return err
		}
	}
	return nil
}

// toMoney multiplies shares*price (both decimal strings) and returns a money string with 2 decimals.
func toMoney(shares, price string) string {
	var s, p float64
	fmt.Sscanf(shares, "%f", &s)
	fmt.Sscanf(price, "%f", &p)
	return fmt.Sprintf("%.2f", s*p)
}
