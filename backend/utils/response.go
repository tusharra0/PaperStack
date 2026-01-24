package utils

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type errorEnvelope struct {
	Error map[string]interface{} `json:"error"`
}

// ErrorResponse writes a standardized error payload.
func ErrorResponse(c *gin.Context, status int, message string) {
	c.JSON(status, errorEnvelope{Error: map[string]interface{}{
		"message": message,
		"code":    http.StatusText(status),
	}})
}

// ValidationError writes validation errors with details per field.
func ValidationError(c *gin.Context, errs map[string]string) {
	c.JSON(http.StatusBadRequest, errorEnvelope{Error: map[string]interface{}{
		"message": "Validation failed",
		"code":    "VALIDATION_ERROR",
		"details": errs,
	}})
}

// NotFoundError writes a standardized not-found response.
func NotFoundError(c *gin.Context, resource string) {
	c.JSON(http.StatusNotFound, errorEnvelope{Error: map[string]interface{}{
		"message": resource + " not found",
		"code":    "NOT_FOUND",
	}})
}

// UnauthorizedError writes a standardized unauthorized response.
func UnauthorizedError(c *gin.Context) {
	c.JSON(http.StatusUnauthorized, errorEnvelope{Error: map[string]interface{}{
		"message": "unauthorized",
		"code":    "UNAUTHORIZED",
	}})
}

// InternalError logs the real error and hides internal details from clients.
func InternalError(c *gin.Context, err error) {
	log.Printf("internal error: %v", err)
	c.JSON(http.StatusInternalServerError, errorEnvelope{Error: map[string]interface{}{
		"message": "internal server error",
		"code":    "INTERNAL_ERROR",
	}})
}
