package db

import (
	"database/sql"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

// addSafeParams enforces simple protocol to avoid
// Neon/pgBouncer bind/result format errors.
func addSafeParams(dsn string) string {
	toAdd := map[string]string{
		"default_query_exec_mode": "simple_protocol",
	}

	// Check if it's a URI
	isURI := strings.HasPrefix(dsn, "postgres://") || strings.HasPrefix(dsn, "postgresql://")

	if isURI {
		prefix := "?"
		if strings.Contains(dsn, "?") {
			prefix = "&"
		}
		var extra []string
		for k, v := range toAdd {
			if !strings.Contains(dsn, k+"=") {
				extra = append(extra, k+"="+v)
			}
		}
		if len(extra) > 0 {
			return dsn + prefix + strings.Join(extra, "&")
		}
		return dsn
	}

	// Assume Key-Value format otherwise
	var extra []string
	for k, v := range toAdd {
		if !strings.Contains(dsn, k+"=") {
			extra = append(extra, k+"="+v)
		}
	}
	if len(extra) > 0 {
		return dsn + " " + strings.Join(extra, " ")
	}
	return dsn
}

// ConnectPostgres opens a PostgreSQL connection using the provided DSN and
// applies sensible pool defaults. It pings the database before returning.
func ConnectPostgres(dsn string) (*sql.DB, error) {
	conn, err := sql.Open("pgx", addSafeParams(dsn))
	if err != nil {
		return nil, err
	}

	conn.SetMaxOpenConns(15)
	conn.SetMaxIdleConns(5)
	conn.SetConnMaxLifetime(time.Hour)

	if err := conn.Ping(); err != nil {
		conn.Close()
		return nil, err
	}

	return conn, nil
}
