package handlers

import (
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

const (
	authHeader = "Authorization"
)

// UserIndentity for indentiry user by jwt token session
// Validates access token (1 hour expiration)
// For token refresh, use /auth/refresh endpoint with refresh token
func (h *Handlers) UserIndentity(c *fiber.Ctx) error {
	header := c.Get(authHeader)

	if header == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "missing auth header",
		})
	}

	// Split header for give a two parts "Bearer" and "Token"
	parts := strings.Split(header, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid auth header format",
		})
	}

	// This is token
	tokenStr := parts[1]

	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fiber.NewError(fiber.StatusUnauthorized, "invalid token signing method")
		}
		return []byte(h.jwtSecret), nil
	})

	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid or expired token",
		})
	}

	claims, ok := token.Claims.(jwt.MapClaims)

	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid token claims",
		})
	}

	// Verify token type - should be "access" token
	tokenType, ok := claims["type"].(string)
	if !ok || tokenType != "access" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid token type - access token required",
		})
	}

	userID, ok := claims["user_id"]
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "missing user_id in token",
		})
	}

	tokenVersionClaim, ok := claims["token_version"].(float64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid token version",
		})
	}

	if exp, ok := claims["exp"].(float64); ok && int64(exp) < time.Now().Unix() {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "token expired",
		})
	}

	userIDStr := ""
	switch v := userID.(type) {
	case string:
		userIDStr = v
	case float64:
		userIDStr = fmt.Sprintf("%.0f", v)
	default:
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid user_id in token",
		})
	}

	currentVersion, err := h.userService.GetTokenVersion(c.Context(), userIDStr)
	if err != nil || int(tokenVersionClaim) != currentVersion {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "token invalidated",
		})
	}

	// Saved email in local storage
	c.Locals("user_id", userIDStr)

	// Next proccess
	return c.Next()
}

func (h *Handlers) getAuthenticatedUserID(ctx *fiber.Ctx) (string, error) {
	userInterfaceID := ctx.Locals("user_id")

	log.Printf("DEBUG user_id from Locals: %#v (%T)", userInterfaceID, userInterfaceID)

	if userInterfaceID == nil {
		return "", ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "user not authenticated or token missing",
		})
	}

	if userID, ok := userInterfaceID.(string); ok {
		return userID, nil
	}

	if floatID, isFloat := userInterfaceID.(float64); isFloat {
		userID := fmt.Sprintf("%.0f", floatID)

		return userID, nil
	}

	log.Printf("ERROR: failed to assert userID from context. Type found: %T", userInterfaceID)
	return "", ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
		"error": "internal authentication error: invalid ID format",
	})
}
