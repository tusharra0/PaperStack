package handlers

import (
	"net/http"
	"strconv"

	"paperstack/services"
	"paperstack/utils"

	"github.com/gin-gonic/gin"
)

// GetLeaderboardHandler serves GET /api/leaderboard?limit=50
func GetLeaderboardHandler(lbSvc *services.LeaderboardService) gin.HandlerFunc {
	return func(c *gin.Context) {
		limitStr := c.DefaultQuery("limit", "50")
		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit <= 0 {
			utils.ValidationError(c, map[string]string{"limit": "limit must be a positive integer"})
			return
		}

		currentUserID := ""
		if uid, ok := c.Get("userID"); ok {
			if s, okCast := uid.(string); okCast {
				currentUserID = s
			}
		}

		resp, err := lbSvc.GetLeaderboardResponse(c.Request.Context(), limit, currentUserID)
		if err != nil {
			utils.InternalError(c, err)
			return
		}

		c.JSON(http.StatusOK, resp)
	}
}
