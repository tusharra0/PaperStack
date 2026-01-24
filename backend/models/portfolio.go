package models

// Portfolio mirrors the portfolios table.
type Portfolio struct {
	ID          string  `json:"id"`
	UserID      string  `json:"user_id"`
	CashBalance float64 `json:"cash_balance"`
}

// Holding mirrors the holdings table.
type Holding struct {
	ID          string  `json:"id"`
	PortfolioID string  `json:"portfolio_id"`
	Symbol      string  `json:"symbol"`
	Shares      float64 `json:"shares"`
	AverageCost float64 `json:"average_cost"`
}

// HoldingWithPrice augments holding with live pricing.
type HoldingWithPrice struct {
	ID              string  `json:"id"`
	Symbol          string  `json:"symbol"`
	Shares          float64 `json:"shares"`
	AverageCost     float64 `json:"average_cost"`
	CurrentPrice    float64 `json:"current_price"`
	MarketValue     float64 `json:"market_value"`
	GainLoss        float64 `json:"gain_loss"`
	GainLossPercent float64 `json:"gain_loss_percent"`
}

// PortfolioResponse is returned to clients for portfolio views.
type PortfolioResponse struct {
	ID                 string             `json:"id"`
	CashBalance        float64            `json:"cash_balance"`
	TotalValue         float64            `json:"total_value"`
	TotalReturn        float64            `json:"total_return"`
	TotalReturnPercent float64            `json:"total_return_percent"`
	Holdings           []HoldingWithPrice `json:"holdings"`
}
