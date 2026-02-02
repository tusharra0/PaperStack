package models

import "time"

type WatchlistItem struct {
	ID      string    `json:"id"`
	Symbol  string    `json:"symbol"`
	AddedAt time.Time `json:"added_at"`
}

type WatchlistItemWithPrice struct {
	ID            string  `json:"id"`
	Symbol        string  `json:"symbol"`
	Price         float64 `json:"price"`
	ChangePercent float64 `json:"change_percent"`
	AddedAt       string  `json:"added_at"`
}

type AddWatchlistRequest struct {
	Symbol string `json:"symbol"`
}

type WatchlistResponse struct {
	Items []WatchlistItemWithPrice `json:"items"`
}
