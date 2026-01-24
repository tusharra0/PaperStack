package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	dbsqlc "paperstack/db/sqlc"
	"paperstack/models"
	"paperstack/services"
	"paperstack/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func ExecuteTradeHandler(tradeSvc *services.TradingService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.TradeRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			utils.ValidationError(c, map[string]string{"body": "invalid request body"})
			return
		}

		validationErrs := map[string]string{}
		if !utils.ValidateStockSymbol(req.Symbol) {
			validationErrs["symbol"] = "symbol must be 1-5 uppercase letters"
		}
		if !utils.ValidateShares(req.Shares) {
			validationErrs["shares"] = "shares must be positive with up to 6 decimal places"
		}
		if req.Type != "BUY" && req.Type != "SELL" {
			validationErrs["type"] = "type must be BUY or SELL"
		}
		if len(validationErrs) > 0 {
			utils.ValidationError(c, validationErrs)
			return
		}

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

		resp, err := tradeSvc.ExecuteTrade(c.Request.Context(), userUUID, req)
		if err != nil {
			status := http.StatusBadRequest
			switch err {
			case services.ErrInsufficientFunds, services.ErrInsufficientShares, services.ErrInvalidSymbol:
				status = http.StatusBadRequest
			case sql.ErrNoRows:
				status = http.StatusNotFound
			default:
				status = http.StatusInternalServerError
			}
			utils.ErrorResponse(c, status, err.Error())
			return
		}

		c.JSON(http.StatusCreated, resp)
	}
}

func GetTransactionsHandler(queries *dbsqlc.Queries) gin.HandlerFunc {
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

		limit := parseQueryInt(c, "limit", 50)
		offset := parseQueryInt(c, "offset", 0)
		symbol := c.Query("symbol")

		ctx := c.Request.Context()
		portfolio, err := queries.GetPortfolioByUserID(ctx, userUUID)
		if err != nil {
			if err == sql.ErrNoRows {
				utils.NotFoundError(c, "portfolio")
				return
			}
			utils.InternalError(c, err)
			return
		}

		var txns []dbsqlc.Transaction
		if symbol != "" {
			txns, err = queries.GetTransactionsBySymbol(ctx, dbsqlc.GetTransactionsBySymbolParams{
				PortfolioID: portfolio.ID,
				Symbol:      symbol,
				Limit:       limit,
				Offset:      offset,
			})
		} else {
			txns, err = queries.GetTransactionsByPortfolioID(ctx, dbsqlc.GetTransactionsByPortfolioIDParams{
				PortfolioID: portfolio.ID,
				Limit:       limit,
				Offset:      offset,
			})
		}
		if err != nil {
			utils.InternalError(c, err)
			return
		}

		resp := models.TransactionListResponse{
			Transactions: make([]models.Transaction, 0, len(txns)),
			Total:        int64(len(txns)),
			Limit:        limit,
			Offset:       offset,
		}
		for _, t := range txns {
			resp.Transactions = append(resp.Transactions, services.ToTransactionModel(t))
		}

		c.JSON(http.StatusOK, resp)
	}
}

func parseQueryInt(c *gin.Context, key string, def int32) int32 {
	valStr := c.DefaultQuery(key, strconv.Itoa(int(def)))
	val, err := strconv.Atoi(valStr)
	if err != nil || val < 0 {
		return def
	}
	return int32(val)
}
