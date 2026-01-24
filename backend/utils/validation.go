package utils

import (
	"regexp"
	"strconv"
	"strings"
	"unicode"
)

var (
	emailRegex    = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)
	usernameRegex = regexp.MustCompile(`^[A-Za-z0-9_]{3,20}$`)
	symbolRegex   = regexp.MustCompile(`^[A-Z]{1,5}$`)
)

func ValidateEmail(email string) bool {
	return emailRegex.MatchString(email)
}

func ValidatePassword(password string) bool {
	if len(password) < 8 {
		return false
	}
	hasLetter := false
	hasNumber := false
	for _, r := range password {
		switch {
		case unicode.IsLetter(r):
			hasLetter = true
		case unicode.IsDigit(r):
			hasNumber = true
		}
	}
	return hasLetter && hasNumber
}

func ValidateUsername(username string) bool {
	return usernameRegex.MatchString(username)
}

func ValidateStockSymbol(symbol string) bool {
	return symbolRegex.MatchString(symbol)
}

// ValidateShares ensures a positive number with up to 6 decimal places.
func ValidateShares(shares float64) bool {
	if shares <= 0 {
		return false
	}
	str := strconv.FormatFloat(shares, 'f', -1, 64)
	if idx := strings.IndexByte(str, '.'); idx != -1 {
		if len(str[idx+1:]) > 6 {
			return false
		}
	}
	return true
}
