package services

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"

	"paperstack/models"
)

type StockService struct {
	apiKey string
	client *http.Client
}

func NewStockService(apiKey string) *StockService {
	return &StockService{
		apiKey: apiKey,
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

// GetQuote fetches a live quote for a symbol from Finnhub.
func (s *StockService) GetQuote(ctx context.Context, symbol string) (models.StockQuote, error) {
	symbol = strings.ToUpper(symbol)

	reqURL := fmt.Sprintf("https://finnhub.io/api/v1/quote?symbol=%s&token=%s", symbol, s.apiKey)

	var resp struct {
		C  float64 `json:"c"`  // Current price
		D  float64 `json:"d"`  // Change
		Dp float64 `json:"dp"` // Percent change
		H  float64 `json:"h"`  // High
		L  float64 `json:"l"`  // Low
		O  float64 `json:"o"`  // Open
		Pc float64 `json:"pc"` // Previous close
	}

	if err := s.getJSON(ctx, reqURL, &resp); err != nil {
		return models.StockQuote{}, err
	}

	if resp.C == 0 {
		return models.StockQuote{}, fmt.Errorf("symbol not found")
	}

	return models.StockQuote{
		Symbol:        symbol,
		Name:          symbol,
		Price:         resp.C,
		Change:        resp.D,
		ChangePercent: resp.Dp,
		High:          resp.H,
		Low:           resp.L,
		Volume:        0,
		UpdatedAt:     time.Now(),
	}, nil
}

// GetQuoteWithCache fetches a quote directly (no caching without Redis).
func (s *StockService) GetQuoteWithCache(ctx context.Context, symbol string) (models.StockQuote, error) {
	return s.GetQuote(ctx, symbol)
}

// InvalidateStockCache is a no-op without Redis.
func (s *StockService) InvalidateStockCache(ctx context.Context, symbol string) {
	// No-op: caching disabled
}

// SearchStocks queries Finnhub symbol search.
func (s *StockService) SearchStocks(ctx context.Context, query string) ([]models.SearchResult, error) {
	params := url.Values{}
	params.Set("q", query)
	params.Set("token", s.apiKey)

	reqURL := "https://finnhub.io/api/v1/search?" + params.Encode()

	var resp struct {
		Count  int `json:"count"`
		Result []struct {
			Symbol      string `json:"symbol"`
			Description string `json:"description"`
			Type        string `json:"type"`
		} `json:"result"`
	}

	if err := s.getJSON(ctx, reqURL, &resp); err != nil {
		return nil, err
	}

	results := make([]models.SearchResult, 0, len(resp.Result))
	for _, r := range resp.Result {
		// Filter to only common stocks (skip ETFs, mutual funds, etc. for cleaner results)
		if r.Type == "Common Stock" || r.Type == "" {
			results = append(results, models.SearchResult{
				Symbol:   r.Symbol,
				Name:     r.Description,
				Exchange: r.Type,
			})
		}
	}

	// Limit to 10 results
	if len(results) > 10 {
		results = results[:10]
	}

	return results, nil
}

// GetHistoricalPrices fetches candle data from Finnhub.
func (s *StockService) GetHistoricalPrices(ctx context.Context, symbol, period string) (models.StockHistoryResponse, error) {
	symbol = strings.ToUpper(symbol)

	// Calculate time range based on period
	now := time.Now()
	var from time.Time
	resolution := "D" // Daily candles

	switch period {
	case "1D":
		from = now.AddDate(0, 0, -1)
		resolution = "5" // 5 min candles for 1 day
	case "1W":
		from = now.AddDate(0, 0, -7)
		resolution = "60" // hourly for 1 week
	case "1M":
		from = now.AddDate(0, -1, 0)
	case "3M":
		from = now.AddDate(0, -3, 0)
	case "1Y":
		from = now.AddDate(-1, 0, 0)
	default:
		from = now.AddDate(0, -1, 0) // default 1 month
	}

	reqURL := fmt.Sprintf(
		"https://finnhub.io/api/v1/stock/candle?symbol=%s&resolution=%s&from=%d&to=%d&token=%s",
		symbol, resolution, from.Unix(), now.Unix(), s.apiKey,
	)

	var resp struct {
		C []float64 `json:"c"` // Close prices
		H []float64 `json:"h"` // High
		L []float64 `json:"l"` // Low
		O []float64 `json:"o"` // Open
		T []int64   `json:"t"` // Timestamps
		V []int64   `json:"v"` // Volume
		S string    `json:"s"` // Status
	}

	if err := s.getJSON(ctx, reqURL, &resp); err != nil {
		return models.StockHistoryResponse{}, err
	}

	if resp.S == "no_data" || len(resp.C) == 0 {
		return models.StockHistoryResponse{}, fmt.Errorf("no historical data found")
	}

	points := make([]models.PricePoint, 0, len(resp.C))
	for i := range resp.C {
		points = append(points, models.PricePoint{
			Date:   time.Unix(resp.T[i], 0),
			Open:   resp.O[i],
			High:   resp.H[i],
			Low:    resp.L[i],
			Close:  resp.C[i],
			Volume: resp.V[i],
		})
	}

	sort.Slice(points, func(i, j int) bool { return points[i].Date.Before(points[j].Date) })

	return models.StockHistoryResponse{
		Symbol:  symbol,
		Period:  period,
		History: points,
	}, nil
}

// Helpers
func (s *StockService) getJSON(ctx context.Context, url string, target interface{}) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return err
	}
	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("stock api error: %s", resp.Status)
	}

	return json.NewDecoder(resp.Body).Decode(target)
}
