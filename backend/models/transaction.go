package models

import "time"

type Transaction struct {
	ID            string    `json:"id"`
	PortfolioID   string    `json:"portfolio_id"`
	Symbol        string    `json:"symbol"`
	Type          string    `json:"type"`
	Shares        float64   `json:"shares"`
	PricePerShare float64   `json:"price_per_share"`
	TotalAmount   float64   `json:"total_amount"`
	CreatedAt     time.Time `json:"created_at"`
}

type TradeRequest struct {
	Symbol string  `json:"symbol" binding:"required"`
	Type   string  `json:"type" binding:"required"` // BUY or SELL
	Shares float64 `json:"shares" binding:"required"`
}

type TradeResponse struct {
	Transaction Transaction       `json:"transaction"`
	Portfolio   PortfolioResponse `json:"portfolio"`
}

type TransactionListResponse struct {
	Transactions []Transaction `json:"transactions"`
	Total        int64         `json:"total"`
	Limit        int32         `json:"limit"`
	Offset       int32         `json:"offset"`
}
