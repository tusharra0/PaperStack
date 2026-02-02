package models

import "time"

// BadgeDefinition describes a badge's metadata.
type BadgeDefinition struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
}

// UserBadgeResponse is a badge a user has earned.
type UserBadgeResponse struct {
	BadgeID     string    `json:"badge_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Icon        string    `json:"icon"`
	EarnedAt    time.Time `json:"earned_at"`
}

type BadgesResponse struct {
	Badges    []UserBadgeResponse `json:"badges"`
	NewBadges []UserBadgeResponse `json:"new_badges,omitempty"`
}

// All available badges.
var AllBadges = map[string]BadgeDefinition{
	"first_trade": {
		ID:          "first_trade",
		Name:        "First Trade",
		Description: "Made your first trade",
		Icon:        "rocket",
	},
	"diversified": {
		ID:          "diversified",
		Name:        "Diversified",
		Description: "Own 5+ different stocks",
		Icon:        "pie-chart",
	},
	"diamond_hands": {
		ID:          "diamond_hands",
		Name:        "Diamond Hands",
		Description: "Held a stock for 7+ days",
		Icon:        "gem",
	},
	"green_day": {
		ID:          "green_day",
		Name:        "Green Day",
		Description: "Portfolio up 3%+ in one day",
		Icon:        "trending-up",
	},
	"top_10": {
		ID:          "top_10",
		Name:        "Top 10",
		Description: "Reached top 10 on leaderboard",
		Icon:        "trophy",
	},
	"comeback": {
		ID:          "comeback",
		Name:        "Comeback Kid",
		Description: "Recovered from a 10% loss",
		Icon:        "refresh",
	},
}
