package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"paperstack/config"
	pdb "paperstack/db"
	dbsqlc "paperstack/db/sqlc"
	"paperstack/handlers"
	"paperstack/middleware"
	"paperstack/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	pg, err := pdb.ConnectPostgres(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to postgres: %v", err)
	}
	defer pg.Close()

	queries := dbsqlc.New(pg)
	stockSvc := services.NewStockService(cfg.StockAPIKey)
	tradeSvc := services.NewTradingService(pg, queries, stockSvc)
	leaderboardSvc := services.NewLeaderboardService(queries, stockSvc)
	snapshotSvc := services.NewSnapshotService(queries, stockSvc)
	broadcaster := services.NewPriceBroadcaster(stockSvc)
	badgeSvc := services.NewBadgeService(queries, stockSvc)

	// Start background jobs and websockets
	ctx := context.Background()
	services.StartJobs(ctx, snapshotSvc, leaderboardSvc)
	go broadcaster.Start(ctx)

	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	router.GET("/api/ws/prices", handlers.PricesWebSocketHandler(broadcaster, cfg.JWTSecret))

	authGroup := router.Group("/api/auth")
	{
		authGroup.POST("/register", handlers.RegisterHandler(queries, cfg))
		authGroup.POST("/login", handlers.LoginHandler(queries, cfg))

		authGroup.GET("/me", middleware.AuthMiddleware(cfg.JWTSecret), handlers.GetMeHandler(queries, pg))
	}

	router.GET("/api/stocks/search", handlers.SearchStocksHandler(stockSvc))
	router.GET("/api/stocks/:symbol", handlers.GetStockQuoteHandler(stockSvc))
	router.GET("/api/stocks/:symbol/history", handlers.GetStockHistoryHandler(stockSvc))

	api := router.Group("/api")
	api.Use(middleware.AuthMiddleware(cfg.JWTSecret))
	{
		api.GET("/portfolio", handlers.GetPortfolioHandler(queries, stockSvc))
		api.GET("/portfolio/history", handlers.GetPortfolioHistoryHandler(queries, snapshotSvc))
		api.GET("/leaderboard", handlers.GetLeaderboardHandler(leaderboardSvc))
		api.POST("/trades", handlers.ExecuteTradeHandler(tradeSvc))
		api.GET("/trades", handlers.GetTransactionsHandler(queries))

		// Watchlist
		api.GET("/watchlist", handlers.GetWatchlistHandler(queries, stockSvc))
		api.POST("/watchlist", handlers.AddWatchlistHandler(queries, stockSvc))
		api.DELETE("/watchlist/:symbol", handlers.RemoveWatchlistHandler(queries))
		api.GET("/watchlist/:symbol", handlers.IsWatchedHandler(queries))

		// Badges
		api.GET("/badges", handlers.GetBadgesHandler(badgeSvc))
		api.POST("/badges/check", handlers.CheckBadgesHandler(badgeSvc))

		// Stats
		api.GET("/stats", handlers.GetTradeStatsHandler(queries))
	}

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("PaperStack backend listening on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
