package models

// LeaderboardEntry represents a single row in the leaderboard response.
type LeaderboardEntry struct {
	Rank               int     `json:"rank"`
	Username           string  `json:"username"`
	TotalReturnPercent float64 `json:"total_return_percent"`
	TotalValue         float64 `json:"total_value"`
}

// LeaderboardResponse bundles leaderboard entries along with the current user's rank.
type LeaderboardResponse struct {
	Entries         []LeaderboardEntry `json:"entries"`
	CurrentUserRank *int               `json:"current_user_rank,omitempty"`
}
