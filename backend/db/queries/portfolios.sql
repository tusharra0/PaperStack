-- name: CreatePortfolio :one
INSERT INTO portfolios (user_id, cash_balance)
VALUES ($1, $2)
RETURNING *;

-- name: GetPortfolioByUserID :one
SELECT * FROM portfolios
WHERE user_id = $1;

-- name: GetPortfolioByID :one
SELECT * FROM portfolios
WHERE id = $1;

-- name: GetAllPortfolios :many
SELECT * FROM portfolios
ORDER BY created_at;

-- name: GetAllPortfoliosWithUsers :many
SELECT p.id, p.user_id, p.cash_balance, p.created_at, p.updated_at, u.username
FROM portfolios p
JOIN users u ON u.id = p.user_id
ORDER BY p.created_at;

-- name: UpdateCashBalance :one
UPDATE portfolios
SET cash_balance = $2,
    updated_at   = now()
WHERE id = $1
RETURNING *;
