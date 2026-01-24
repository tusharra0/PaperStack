-- name: CreatePortfolio :one
INSERT INTO portfolios (user_id, cash_balance)
VALUES ($1, coalesce($2, 100000.00))
RETURNING *;

-- name: GetPortfolioByUserID :one
SELECT * FROM portfolios
WHERE user_id = $1;

-- name: UpdateCashBalance :one
UPDATE portfolios
SET cash_balance = $2,
    updated_at   = now()
WHERE id = $1
RETURNING *;
