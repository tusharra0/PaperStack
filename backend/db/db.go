package db

import (
	"database/sql"
	"time"

	_ "github.com/lib/pq"
)

// ConnectPostgres opens a PostgreSQL connection using the provided DSN and
// applies sensible pool defaults. It pings the database before returning.
func ConnectPostgres(dsn string) (*sql.DB, error) {
	conn, err := sql.Open("postgres", dsn)
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
