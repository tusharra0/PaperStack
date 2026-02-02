package handlers

import (
	"database/sql"
	"net/http"
	"strings"

	dbsqlc "paperstack/db/sqlc"
	"paperstack/models"
	"paperstack/services"
	"paperstack/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const maxWatchlistItems = 20

func AddWatchlistHandler(q *dbsqlc.Queries, stockSvc *services.StockService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userUUID, err := extractUserID(c)
		if err != nil {
			utils.UnauthorizedError(c)
			return
		}

		var req models.AddWatchlistRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			utils.ValidationError(c, map[string]string{"body": "invalid request body"})
			return
		}

		req.Symbol = strings.ToUpper(strings.TrimSpace(req.Symbol))
		if !utils.ValidateStockSymbol(req.Symbol) {
			utils.ValidationError(c, map[string]string{"symbol": "symbol must be 1-5 uppercase letters"})
			return
		}

		// Check max limit
		count, err := q.CountWatchlistItems(c.Request.Context(), userUUID)
		if err != nil {
			utils.InternalError(c, err)
			return
		}
		if count >= maxWatchlistItems {
			utils.ErrorResponse(c, http.StatusBadRequest, "watchlist is full (max 20 stocks)")
			return
		}

		// Verify symbol is valid
		quote, err := stockSvc.GetQuoteWithCache(c.Request.Context(), req.Symbol)
		if err != nil || quote.Price <= 0 {
			utils.ErrorResponse(c, http.StatusBadRequest, "invalid stock symbol")
			return
		}

		item, err := q.AddWatchlistItem(c.Request.Context(), dbsqlc.AddWatchlistItemParams{
			UserID: userUUID,
			Symbol: req.Symbol,
		})
		if err != nil {
			if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
				utils.ErrorResponse(c, http.StatusConflict, "symbol already in watchlist")
				return
			}
			utils.InternalError(c, err)
			return
		}

		c.JSON(http.StatusCreated, models.WatchlistItemWithPrice{
			ID:            item.ID.String(),
			Symbol:        item.Symbol,
			Price:         quote.Price,
			ChangePercent: quote.ChangePercent,
			AddedAt:       item.AddedAt.Format("2006-01-02T15:04:05Z"),
		})
	}
}

func RemoveWatchlistHandler(q *dbsqlc.Queries) gin.HandlerFunc {
	return func(c *gin.Context) {
		userUUID, err := extractUserID(c)
		if err != nil {
			utils.UnauthorizedError(c)
			return
		}

		symbol := strings.ToUpper(c.Param("symbol"))
		if symbol == "" {
			utils.ValidationError(c, map[string]string{"symbol": "symbol is required"})
			return
		}

		err = q.RemoveWatchlistItem(c.Request.Context(), dbsqlc.RemoveWatchlistItemParams{
			UserID: userUUID,
			Symbol: symbol,
		})
		if err != nil {
			utils.InternalError(c, err)
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "removed"})
	}
}

func GetWatchlistHandler(q *dbsqlc.Queries, stockSvc *services.StockService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userUUID, err := extractUserID(c)
		if err != nil {
			utils.UnauthorizedError(c)
			return
		}

		items, err := q.GetWatchlistByUserID(c.Request.Context(), userUUID)
		if err != nil {
			utils.InternalError(c, err)
			return
		}

		result := make([]models.WatchlistItemWithPrice, 0, len(items))
		for _, item := range items {
			price := 0.0
			changePct := 0.0
			if quote, err := stockSvc.GetQuoteWithCache(c.Request.Context(), item.Symbol); err == nil {
				price = quote.Price
				changePct = quote.ChangePercent
			}
			result = append(result, models.WatchlistItemWithPrice{
				ID:            item.ID.String(),
				Symbol:        item.Symbol,
				Price:         price,
				ChangePercent: changePct,
				AddedAt:       item.AddedAt.Format("2006-01-02T15:04:05Z"),
			})
		}

		c.JSON(http.StatusOK, models.WatchlistResponse{Items: result})
	}
}

func IsWatchedHandler(q *dbsqlc.Queries) gin.HandlerFunc {
	return func(c *gin.Context) {
		userUUID, err := extractUserID(c)
		if err != nil {
			utils.UnauthorizedError(c)
			return
		}

		symbol := strings.ToUpper(c.Param("symbol"))
		_, err = q.GetWatchlistItem(c.Request.Context(), dbsqlc.GetWatchlistItemParams{
			UserID: userUUID,
			Symbol: symbol,
		})

		watched := err == nil
		if err != nil && err != sql.ErrNoRows {
			utils.InternalError(c, err)
			return
		}

		c.JSON(http.StatusOK, gin.H{"watched": watched})
	}
}

func extractUserID(c *gin.Context) (uuid.UUID, error) {
	userIDStr, ok := c.Get("userID")
	if !ok {
		return uuid.UUID{}, sql.ErrNoRows
	}
	return uuid.Parse(userIDStr.(string))
}
