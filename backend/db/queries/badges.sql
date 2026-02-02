-- name: AwardBadge :one
INSERT INTO user_badges (user_id, badge_id)
VALUES ($1, $2)
ON CONFLICT (user_id, badge_id) DO NOTHING
RETURNING *;

-- name: GetUserBadges :many
SELECT * FROM user_badges
WHERE user_id = $1
ORDER BY earned_at DESC;

-- name: HasBadge :one
SELECT EXISTS(
    SELECT 1 FROM user_badges
    WHERE user_id = $1 AND badge_id = $2
) AS has_badge;

-- name: GetBadgesByUserIDs :many
SELECT * FROM user_badges
WHERE user_id = ANY($1::uuid[])
ORDER BY earned_at;
