-- name: CreateSnapshot :one
INSERT INTO portfolio_snapshots (portfolio_id, total_value, cash_balance, snapshot_date)
VALUES ($1, $2, $3, $4)
ON CONFLICT (portfolio_id, snapshot_date) DO UPDATE
SET total_value = EXCLUDED.total_value,
    cash_balance = EXCLUDED.cash_balance
RETURNING *;

-- name: GetSnapshotsByPortfolioID :many
SELECT * FROM portfolio_snapshots
WHERE portfolio_id = $1
ORDER BY snapshot_date;

-- name: GetSnapshotsInRange :many
SELECT * FROM portfolio_snapshots
WHERE portfolio_id = $1
  AND snapshot_date BETWEEN $2 AND $3
ORDER BY snapshot_date;

-- name: GetLatestSnapshot :one
SELECT * FROM portfolio_snapshots
WHERE portfolio_id = $1
ORDER BY snapshot_date DESC
LIMIT 1;

-- name: DeleteOldSnapshots :exec
DELETE FROM portfolio_snapshots
WHERE snapshot_date < $1;
