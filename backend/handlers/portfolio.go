package handlers

import (
	"database/sql"
	"net/http"

	dbsqlc "paperstack/db/sqlc"
	"paperstack/services"
	"paperstack/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GetPortfolioHandler returns the authenticated user's portfolio with holdings.
func GetPortfolioHandler(q *dbsqlc.Queries, stockSvc services.StockQuoteProvider) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr, ok := c.Get("userID")
		if !ok {
			utils.UnauthorizedError(c)
			return
		}
		userUUID, err := uuid.Parse(userIDStr.(string))
		if err != nil {
			utils.UnauthorizedError(c)
			return
		}

		result, err := services.GetPortfolioWithHoldings(c.Request.Context(), q, stockSvc, userUUID)
		if err != nil {
			if err == sql.ErrNoRows {
				utils.NotFoundError(c, "portfolio")
				return
			}
			utils.InternalError(c, err)
			return
		}

		c.JSON(http.StatusOK, result)
	}
}

// GetPortfolioHistoryHandler returns historical snapshots for charting.
func GetPortfolioHistoryHandler(q *dbsqlc.Queries, snapshotSvc *services.SnapshotService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDStr, exists := c.Get("userID")
		if !exists {
			utils.UnauthorizedError(c)
			return
		}
		userUUID, err := uuid.Parse(userIDStr.(string))
		if err != nil {
			utils.UnauthorizedError(c)
			return
		}

		period := c.DefaultQuery("period", "1M")

		portfolio, err := q.GetPortfolioByUserID(c.Request.Context(), userUUID)
		if err != nil {
			if err == sql.ErrNoRows {
				utils.NotFoundError(c, "portfolio")
				return
			}
			utils.InternalError(c, err)
			return
		}

		history, err := snapshotSvc.GetPortfolioHistory(c.Request.Context(), portfolio.ID, period)
		if err != nil {
			utils.InternalError(c, err)
			return
		}

		c.JSON(http.StatusOK, history)
	}
}
