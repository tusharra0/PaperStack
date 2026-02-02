package handlers

import (
	"database/sql"
	"net/http"
	"sort"
	"time"

	dbsqlc "paperstack/db/sqlc"
	"paperstack/utils"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

type tradeStats struct {
	TotalTrades    int     `json:"total_trades"`
	WinRate        float64 `json:"win_rate"`
	BestTrade      float64 `json:"best_trade"`
	BestSymbol     string  `json:"best_symbol"`
	WorstTrade     float64 `json:"worst_trade"`
	WorstSymbol    string  `json:"worst_symbol"`
	AvgHoldDays    float64 `json:"avg_hold_days"`
	MostTraded     string  `json:"most_traded"`
	MostTradedCount int    `json:"most_traded_count"`
}

func GetTradeStatsHandler(q *dbsqlc.Queries) gin.HandlerFunc {
	return func(c *gin.Context) {
		userUUID, err := extractUserID(c)
		if err != nil {
			utils.UnauthorizedError(c)
			return
		}

		ctx := c.Request.Context()
		portfolio, err := q.GetPortfolioByUserID(ctx, userUUID)
		if err != nil {
			if err == sql.ErrNoRows {
				c.JSON(http.StatusOK, tradeStats{})
				return
			}
			utils.InternalError(c, err)
			return
		}

		txns, err := q.GetTransactionsByPortfolioID(ctx, dbsqlc.GetTransactionsByPortfolioIDParams{
			PortfolioID: portfolio.ID,
			Limit:       10000,
			Offset:      0,
		})
		if err != nil {
			utils.InternalError(c, err)
			return
		}

		if len(txns) == 0 {
			c.JSON(http.StatusOK, tradeStats{})
			return
		}

		// Sort by created_at ascending
		sort.Slice(txns, func(i, j int) bool {
			return txns[i].CreatedAt.Before(txns[j].CreatedAt)
		})

		// Track buys per symbol to calculate round-trip profitability
		type buyRecord struct {
			price decimal.Decimal
			time  time.Time
		}
		buysBySymbol := map[string][]buyRecord{}
		symbolCounts := map[string]int{}

		wins := 0
		totalRoundTrips := 0
		bestPnl := decimal.Zero
		bestSym := ""
		worstPnl := decimal.Zero
		worstSym := ""
		totalHoldDays := 0.0
		holdCount := 0

		for _, t := range txns {
			symbolCounts[t.Symbol]++
			price := decimal.RequireFromString(t.PricePerShare)
			shares := decimal.RequireFromString(t.Shares)

			if t.Type == "BUY" {
				buysBySymbol[t.Symbol] = append(buysBySymbol[t.Symbol], buyRecord{
					price: price,
					time:  t.CreatedAt,
				})
			} else if t.Type == "SELL" {
				buys := buysBySymbol[t.Symbol]
				if len(buys) > 0 {
					// Match against earliest buy (FIFO)
					buy := buys[0]
					buysBySymbol[t.Symbol] = buys[1:]

					pnl := price.Sub(buy.price).Mul(shares)
					totalRoundTrips++

					pnlFloat, _ := pnl.Float64()
					if pnl.IsPositive() {
						wins++
					}

					if bestSym == "" || pnl.GreaterThan(bestPnl) {
						bestPnl = pnl
						bestSym = t.Symbol
					}
					if worstSym == "" || pnl.LessThan(worstPnl) {
						worstPnl = pnl
						worstSym = t.Symbol
					}

					days := t.CreatedAt.Sub(buy.time).Hours() / 24
					totalHoldDays += days
					holdCount++
					_ = pnlFloat
				}
			}
		}

		winRate := 0.0
		if totalRoundTrips > 0 {
			winRate = float64(wins) / float64(totalRoundTrips) * 100
		}

		avgHold := 0.0
		if holdCount > 0 {
			avgHold = totalHoldDays / float64(holdCount)
		}

		// Find most traded symbol
		mostTraded := ""
		mostCount := 0
		for sym, count := range symbolCounts {
			if count > mostCount {
				mostCount = count
				mostTraded = sym
			}
		}

		bestF, _ := bestPnl.Float64()
		worstF, _ := worstPnl.Float64()

		c.JSON(http.StatusOK, tradeStats{
			TotalTrades:    len(txns),
			WinRate:        winRate,
			BestTrade:      bestF,
			BestSymbol:     bestSym,
			WorstTrade:     worstF,
			WorstSymbol:    worstSym,
			AvgHoldDays:    avgHold,
			MostTraded:     mostTraded,
			MostTradedCount: mostCount,
		})
	}
}
