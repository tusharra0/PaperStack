-- name: CreateTransaction :one
INSERT INTO transactions (portfolio_id, symbol, type, shares, price_per_share, total_amount)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetTransactionsByPortfolioID :many
SELECT *
FROM transactions
WHERE portfolio_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetTransactionsBySymbol :many
SELECT *
FROM transactions
WHERE portfolio_id = $1 AND symbol = $2
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;
