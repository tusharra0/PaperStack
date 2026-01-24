package services

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strconv"
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

// GetQuote fetches a live quote for a symbol from Alpha Vantage.
func (s *StockService) GetQuote(ctx context.Context, symbol string) (models.StockQuote, error) {
	symbol = strings.ToUpper(symbol)
	params := url.Values{}
	params.Set("function", "GLOBAL_QUOTE")
	params.Set("symbol", symbol)
	params.Set("apikey", s.apiKey)

	reqURL := "https://www.alphavantage.co/query?" + params.Encode()

	var resp struct {
		GlobalQuote map[string]string `json:"Global Quote"`
	}

	if err := s.getJSON(ctx, reqURL, &resp); err != nil {
		return models.StockQuote{}, err
	}

	if len(resp.GlobalQuote) == 0 {
		return models.StockQuote{}, fmt.Errorf("symbol not found")
	}

	q := resp.GlobalQuote
	price := parseFloat(q["05. price"])
	change := parseFloat(q["09. change"])
	changePct := parsePercent(q["10. change percent"])

	return models.StockQuote{
		Symbol:        symbol,
		Name:          symbol,
		Price:         price,
		Change:        change,
		ChangePercent: changePct,
		High:          parseFloat(q["03. high"]),
		Low:           parseFloat(q["04. low"]),
		Volume:        int64(parseFloat(q["06. volume"])),
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

// SearchStocks queries Alpha Vantage SYMBOL_SEARCH.
func (s *StockService) SearchStocks(ctx context.Context, query string) ([]models.SearchResult, error) {
	params := url.Values{}
	params.Set("function", "SYMBOL_SEARCH")
	params.Set("keywords", query)
	params.Set("apikey", s.apiKey)

	reqURL := "https://www.alphavantage.co/query?" + params.Encode()

	var resp struct {
		BestMatches []map[string]string `json:"bestMatches"`
	}

	if err := s.getJSON(ctx, reqURL, &resp); err != nil {
		return nil, err
	}

	results := make([]models.SearchResult, 0, len(resp.BestMatches))
	for _, m := range resp.BestMatches {
		results = append(results, models.SearchResult{
			Symbol:   m["1. symbol"],
			Name:     m["2. name"],
			Exchange: m["4. region"],
		})
	}
	return results, nil
}

// GetHistoricalPrices fetches daily history and trims per requested period.
func (s *StockService) GetHistoricalPrices(ctx context.Context, symbol, period string) (models.StockHistoryResponse, error) {
	params := url.Values{}
	params.Set("function", "TIME_SERIES_DAILY_ADJUSTED")
	params.Set("symbol", strings.ToUpper(symbol))
	params.Set("outputsize", "compact")
	params.Set("apikey", s.apiKey)

	reqURL := "https://www.alphavantage.co/query?" + params.Encode()

	var resp struct {
		TimeSeries map[string]map[string]string `json:"Time Series (Daily)"`
	}

	if err := s.getJSON(ctx, reqURL, &resp); err != nil {
		return models.StockHistoryResponse{}, err
	}

	if len(resp.TimeSeries) == 0 {
		return models.StockHistoryResponse{}, fmt.Errorf("symbol not found")
	}

	points := make([]models.PricePoint, 0, len(resp.TimeSeries))
	for dateStr, v := range resp.TimeSeries {
		date, _ := time.Parse("2006-01-02", dateStr)
		points = append(points, models.PricePoint{
			Date:   date,
			Open:   parseFloat(v["1. open"]),
			High:   parseFloat(v["2. high"]),
			Low:    parseFloat(v["3. low"]),
			Close:  parseFloat(v["4. close"]),
			Volume: int64(parseFloat(v["6. volume"])),
		})
	}

	sort.Slice(points, func(i, j int) bool { return points[i].Date.Before(points[j].Date) })

	points = trimHistory(points, period)

	return models.StockHistoryResponse{
		Symbol:  strings.ToUpper(symbol),
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

func parseFloat(s string) float64 {
	f, _ := strconv.ParseFloat(s, 64)
	return f
}

func parsePercent(s string) float64 {
	s = strings.TrimSpace(strings.TrimSuffix(s, "%"))
	return parseFloat(s)
}

func trimHistory(points []models.PricePoint, period string) []models.PricePoint {
	if len(points) == 0 {
		return points
	}
	now := points[len(points)-1].Date
	var cutoff time.Time
	switch period {
	case "1D":
		cutoff = now.AddDate(0, 0, -1)
	case "1W":
		cutoff = now.AddDate(0, 0, -7)
	case "1M":
		cutoff = now.AddDate(0, -1, 0)
	case "3M":
		cutoff = now.AddDate(0, -3, 0)
	case "1Y":
		cutoff = now.AddDate(-1, 0, 0)
	default:
		return points
	}
	filtered := make([]models.PricePoint, 0, len(points))
	for _, p := range points {
		if p.Date.After(cutoff) || p.Date.Equal(cutoff) {
			filtered = append(filtered, p)
		}
	}
	return filtered
}
