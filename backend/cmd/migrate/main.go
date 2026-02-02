package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/lib/pq"
	"database/sql"
)

func main() {
	_ = godotenv.Load()
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL not set")
	}

	// lib/pq needs the connection string parsed
	_ = pq.Driver{}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("failed to connect: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("failed to ping: %v", err)
	}
	fmt.Println("Connected to database.")

	migrations := []string{
		"db/migrations/001_initial_schema.sql",
		"db/migrations/002_watchlist_badges.sql",
	}

	for _, path := range migrations {
		data, err := os.ReadFile(path)
		if err != nil {
			log.Fatalf("failed to read %s: %v", path, err)
		}
		fmt.Printf("Running %s...\n", path)
		_, err = db.Exec(string(data))
		if err != nil {
			log.Fatalf("migration %s failed: %v", path, err)
		}
		fmt.Printf("  ✓ %s applied\n", path)
	}

	fmt.Println("All migrations applied successfully.")
}
