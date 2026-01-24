package handlers

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"time"

	"paperstack/config"
	dbsqlc "paperstack/db/sqlc"
	"paperstack/models"
	"paperstack/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func RegisterHandler(q *dbsqlc.Queries, cfg config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.RegisterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			utils.ValidationError(c, map[string]string{"body": "invalid request body"})
			return
		}

		validationErrs := map[string]string{}
		if !utils.ValidateEmail(req.Email) {
			validationErrs["email"] = "invalid email format"
		}
		if !utils.ValidatePassword(req.Password) {
			validationErrs["password"] = "password must be at least 8 characters and include letters and numbers"
		}
		if !utils.ValidateUsername(req.Username) {
			validationErrs["username"] = "username must be 3-20 characters (letters, numbers, underscore)"
		}
		if len(validationErrs) > 0 {
			utils.ValidationError(c, validationErrs)
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		if _, err := q.GetUserByEmail(ctx, req.Email); err == nil {
			utils.ErrorResponse(c, http.StatusConflict, "email already exists")
			return
		} else if err != nil && err != sql.ErrNoRows {
			utils.InternalError(c, err)
			return
		}

		if _, err := q.GetUserByUsername(ctx, req.Username); err == nil {
			utils.ErrorResponse(c, http.StatusConflict, "username already exists")
			return
		} else if err != nil && err != sql.ErrNoRows {
			utils.InternalError(c, err)
			return
		}

		hashed, err := utils.HashPassword(req.Password)
		if err != nil {
			utils.InternalError(c, err)
			return
		}

		user, err := q.CreateUser(ctx, dbsqlc.CreateUserParams{
			Email:        req.Email,
			PasswordHash: hashed,
			Username:     req.Username,
		})
		if err != nil {
			utils.InternalError(c, err)
			return
		}

		// Create a starting portfolio with $100,000 virtual cash.
		if _, err = q.CreatePortfolio(ctx, dbsqlc.CreatePortfolioParams{
			UserID:      user.ID,
			CashBalance: "100000.00",
		}); err != nil {
			utils.InternalError(c, err)
			return
		}

		token, err := utils.GenerateToken(user.ID.String(), cfg.JWTSecret)
		if err != nil {
			utils.InternalError(c, err)
			return
		}

		c.JSON(http.StatusCreated, models.AuthResponse{
			User:  toUserResponse(user),
			Token: token,
		})
	}
}

func LoginHandler(q *dbsqlc.Queries, cfg config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			utils.ValidationError(c, map[string]string{"body": "invalid request body"})
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		user, err := q.GetUserByEmail(ctx, req.Email)
		if err == sql.ErrNoRows {
			utils.UnauthorizedError(c)
			return
		} else if err != nil {
			utils.InternalError(c, err)
			return
		}

		if !utils.CheckPassword(user.PasswordHash, req.Password) {
			utils.UnauthorizedError(c)
			return
		}

		token, err := utils.GenerateToken(user.ID.String(), cfg.JWTSecret)
		if err != nil {
			utils.InternalError(c, err)
			return
		}

		c.JSON(http.StatusOK, models.AuthResponse{
			User:  toUserResponse(user),
			Token: token,
		})
	}
}

func GetMeHandler(q *dbsqlc.Queries, db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userIDValue, exists := c.Get("userID")
		if !exists {
			utils.UnauthorizedError(c)
			return
		}
		userIDStr, ok := userIDValue.(string)
		if !ok {
			utils.UnauthorizedError(c)
			return
		}

		userUUID, err := uuid.Parse(userIDStr)
		if err != nil {
			utils.UnauthorizedError(c)
			return
		}

		ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
		defer cancel()

		user, err := q.GetUserByID(ctx, userUUID)
		if err != nil {
			if err == sql.ErrNoRows {
				utils.UnauthorizedError(c)
				return
			}
			log.Printf("Failed to fetch user: %v", err)
			utils.InternalError(c, err)
			return
		}

		c.JSON(http.StatusOK, toUserResponse(user))
	}
}

func toUserResponse(user dbsqlc.User) models.UserResponse {
	return models.UserResponse{
		ID:        user.ID.String(),
		Email:     user.Email,
		Username:  user.Username,
		CreatedAt: user.CreatedAt,
	}
}
