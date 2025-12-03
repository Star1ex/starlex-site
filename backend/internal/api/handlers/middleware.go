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
	jwtSecret  = "super_secret_key_123"
)

// UserIdentity for indentiry user by jwt token session
// Session saves 24 hours
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
		return []byte(jwtSecret), nil
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

	userID, ok := claims["user_id"]
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "missing user_id in token",
		})
	}

	if exp, ok := claims["exp"].(float64); ok && int64(exp) < time.Now().Unix() {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "token expired",
		})
	}

	// Saved email in local storage
	c.Locals("user_id", userID)

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
