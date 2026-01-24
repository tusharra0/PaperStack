package main

import (
	"fmt"
	"log"

	"paperstack/config"
	pdb "paperstack/db"

	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	pg, err := pdb.ConnectPostgres(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to postgres: %v", err)
	}
	defer pg.Close()

	redisClient, err := pdb.ConnectRedis(cfg.RedisURL)
	if err != nil {
		log.Fatalf("failed to connect to redis: %v", err)
	}
	defer redisClient.Close()

	router := gin.Default()

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("PaperStack backend listening on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
