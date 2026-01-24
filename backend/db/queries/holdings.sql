-- name: CreateHolding :one
INSERT INTO holdings (portfolio_id, symbol, shares, average_cost)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetHoldingsByPortfolioID :many
SELECT * FROM holdings
WHERE portfolio_id = $1
ORDER BY symbol;

-- name: GetHoldingBySymbol :one
SELECT * FROM holdings
WHERE portfolio_id = $1 AND symbol = $2;

-- name: UpdateHolding :one
UPDATE holdings
SET shares = $3,
    average_cost = $4,
    updated_at = now()
WHERE portfolio_id = $1 AND symbol = $2
RETURNING *;

-- name: DeleteHolding :exec
DELETE FROM holdings
WHERE portfolio_id = $1 AND symbol = $2;
