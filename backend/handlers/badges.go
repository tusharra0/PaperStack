package handlers

import (
	"net/http"

	"paperstack/services"
	"paperstack/utils"

	"github.com/gin-gonic/gin"
)

func GetBadgesHandler(badgeSvc *services.BadgeService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userUUID, err := extractUserID(c)
		if err != nil {
			utils.UnauthorizedError(c)
			return
		}

		badges, err := badgeSvc.GetUserBadges(c.Request.Context(), userUUID)
		if err != nil {
			utils.InternalError(c, err)
			return
		}

		c.JSON(http.StatusOK, gin.H{"badges": badges})
	}
}

func CheckBadgesHandler(badgeSvc *services.BadgeService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userUUID, err := extractUserID(c)
		if err != nil {
			utils.UnauthorizedError(c)
			return
		}

		newBadges := badgeSvc.CheckAndAwardBadges(c.Request.Context(), userUUID)

		c.JSON(http.StatusOK, gin.H{
			"new_badges": newBadges,
		})
	}
}
