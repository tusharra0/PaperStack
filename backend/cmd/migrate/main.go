package main

import (
	"log"
	"os"
	"path/filepath"
	"sort"

	"paperstack/config"
	pdb "paperstack/db"
)

func main() {
	cfg := config.Load()

	db, err := pdb.ConnectPostgres(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("connect postgres: %v", err)
	}
	defer db.Close()

	migrationsDir := filepath.Join("db", "migrations")
	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		log.Fatalf("read migrations dir: %v", err)
	}

	// Sort by filename to ensure order.
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Name() < entries[j].Name()
	})

	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		path := filepath.Join(migrationsDir, e.Name())
		sqlBytes, err := os.ReadFile(path)
		if err != nil {
			log.Fatalf("read migration %s: %v", path, err)
		}
		log.Printf("Applying migration %s", e.Name())
		if _, err := db.Exec(string(sqlBytes)); err != nil {
			log.Fatalf("apply migration %s: %v", e.Name(), err)
		}
	}

	log.Println("Migrations applied successfully")
}
