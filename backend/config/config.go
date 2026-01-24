package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config holds application configuration values loaded from environment variables.
type Config struct {
	DatabaseURL string
	JWTSecret   string
	RedisURL    string
	StockAPIKey string
	Port        string
}

// Load reads environment variables and returns a Config struct.
// It attempts to load a local .env file first (if present) to aid local development.
func Load() Config {
	// Load .env silently; it's fine if the file doesn't exist in production.
	_ = godotenv.Load()

	cfg := Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
		RedisURL:    os.Getenv("REDIS_URL"),
		StockAPIKey: os.Getenv("STOCK_API_KEY"),
		Port:        os.Getenv("PORT"),
	}

	// Validate required fields early so the app fails fast on misconfiguration.
	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		log.Fatal("JWT_SECRET is required")
	}
	if cfg.RedisURL == "" {
		log.Fatal("REDIS_URL is required")
	}
	if cfg.StockAPIKey == "" {
		log.Fatal("STOCK_API_KEY is required")
	}
	if cfg.Port == "" {
		cfg.Port = "8080"
	}

	return cfg
}
