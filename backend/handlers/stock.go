package handlers

import (
	"net/http"

	"paperstack/services"
	"paperstack/utils"

	"github.com/gin-gonic/gin"
)

func SearchStocksHandler(stockSvc *services.StockService) gin.HandlerFunc {
	return func(c *gin.Context) {
		q := c.Query("q")
		if q == "" {
			utils.ValidationError(c, map[string]string{"q": "query parameter q is required"})
			return
		}
		results, err := stockSvc.SearchStocks(c.Request.Context(), q)
		if err != nil {
			utils.InternalError(c, err)
			return
		}
		c.JSON(http.StatusOK, results)
	}
}

func GetStockQuoteHandler(stockSvc *services.StockService) gin.HandlerFunc {
	return func(c *gin.Context) {
		symbol := c.Param("symbol")
		quote, err := stockSvc.GetQuoteWithCache(c.Request.Context(), symbol)
		if err != nil {
			utils.NotFoundError(c, "symbol")
			return
		}
		c.JSON(http.StatusOK, quote)
	}
}

func GetStockHistoryHandler(stockSvc *services.StockService) gin.HandlerFunc {
	return func(c *gin.Context) {
		symbol := c.Param("symbol")
		period := c.DefaultQuery("period", "1M")

		resp, err := stockSvc.GetHistoricalPrices(c.Request.Context(), symbol, period)
		if err != nil {
			utils.NotFoundError(c, "history")
			return
		}

		c.JSON(http.StatusOK, resp)
	}
}
