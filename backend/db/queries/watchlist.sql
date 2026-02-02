-- name: AddWatchlistItem :one
INSERT INTO watchlist_items (user_id, symbol)
VALUES ($1, $2)
RETURNING *;

-- name: RemoveWatchlistItem :exec
DELETE FROM watchlist_items
WHERE user_id = $1 AND symbol = $2;

-- name: GetWatchlistByUserID :many
SELECT * FROM watchlist_items
WHERE user_id = $1
ORDER BY added_at DESC;

-- name: GetWatchlistItem :one
SELECT * FROM watchlist_items
WHERE user_id = $1 AND symbol = $2;

-- name: CountWatchlistItems :one
SELECT COUNT(*) FROM watchlist_items
WHERE user_id = $1;
