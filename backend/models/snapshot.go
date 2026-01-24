package models

import "time"

// PortfolioSnapshot mirrors the portfolio_snapshots table.
type PortfolioSnapshot struct {
	ID           string    `json:"id"`
	PortfolioID  string    `json:"portfolio_id"`
	TotalValue   float64   `json:"total_value"`
	CashBalance  float64   `json:"cash_balance"`
	SnapshotDate time.Time `json:"snapshot_date"`
	CreatedAt    time.Time `json:"created_at"`
}

// SnapshotPoint is a simplified data point for charting portfolio history.
type SnapshotPoint struct {
	Date       time.Time `json:"date"`
	TotalValue float64   `json:"total_value"`
}

// PortfolioHistoryResponse wraps historical snapshot points for a portfolio.
type PortfolioHistoryResponse struct {
	Points []SnapshotPoint `json:"points"`
}
