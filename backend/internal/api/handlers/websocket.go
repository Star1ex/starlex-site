package handlers

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/Star1ex/starlex-site/internal/realtime"
	fiberws "github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

func (h *Handlers) PrepareWorkspaceWebSocket(c *fiber.Ctx) error {
	if !fiberws.IsWebSocketUpgrade(c) {
		return fiber.ErrUpgradeRequired
	}

	workspaceID := strings.TrimSpace(c.Query("workspace_id"))
	if workspaceID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "workspace_id is required"})
	}
	token := h.websocketAccessToken(c)
	if token == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "access token is required"})
	}

	userID, err := h.authenticateAccessToken(c.Context(), token)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid or expired token"})
	}
	if _, err := h.workspaceService.GetRole(c.Context(), workspaceID, userID); err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
	}

	c.Locals("workspace_id", workspaceID)
	c.Locals("user_id", userID)
	return c.Next()
}

func (h *Handlers) HandleWorkspaceWebSocket(conn *fiberws.Conn) {
	workspaceID := websocketLocalString(conn, "workspace_id")
	userID := websocketLocalString(conn, "user_id")
	if workspaceID == "" || userID == "" || h.realtimeHub == nil {
		_ = conn.Close()
		return
	}

	client := realtime.NewClient(conn, h.realtimeHub, workspaceID, userID)
	h.realtimeHub.Register(client)
	go client.WritePump()
	client.ReadPump()
}

func (h *Handlers) websocketAccessToken(c *fiber.Ctx) string {
	if token := strings.TrimSpace(c.Query("token")); token != "" {
		return token
	}
	if token := strings.TrimSpace(c.Query("access_token")); token != "" {
		return token
	}
	protocols := strings.Split(c.Get("Sec-WebSocket-Protocol"), ",")
	for _, protocol := range protocols {
		value := strings.TrimSpace(protocol)
		lowerValue := strings.ToLower(value)
		if strings.HasPrefix(lowerValue, "bearer ") {
			return strings.TrimSpace(value[len("bearer "):])
		}
		if strings.HasPrefix(lowerValue, "bearer.") {
			return strings.TrimSpace(value[len("bearer."):])
		}
		if lowerValue == "bearer" {
			continue
		}
		if value != "" {
			return value
		}
	}
	return ""
}

func (h *Handlers) authenticateAccessToken(ctx context.Context, tokenStr string) (string, error) {
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid token signing method")
		}
		return []byte(h.jwtSecret), nil
	})
	if err != nil || !token.Valid {
		return "", errors.New("invalid token")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New("invalid token claims")
	}
	tokenType, ok := claims["type"].(string)
	if !ok || tokenType != "access" {
		return "", errors.New("invalid token type")
	}
	if exp, ok := claims["exp"].(float64); ok && int64(exp) < time.Now().Unix() {
		return "", errors.New("token expired")
	}
	userID, err := claimString(claims, "user_id")
	if err != nil {
		return "", err
	}
	tokenVersionClaim, ok := claims["token_version"].(float64)
	if !ok {
		return "", errors.New("invalid token version")
	}
	currentVersion, err := h.userService.GetTokenVersion(ctx, userID)
	if err != nil || int(tokenVersionClaim) != currentVersion {
		return "", errors.New("token invalidated")
	}
	return userID, nil
}

func websocketLocalString(conn *fiberws.Conn, key string) string {
	value := conn.Locals(key)
	switch typed := value.(type) {
	case string:
		return typed
	case float64:
		return fmt.Sprintf("%.0f", typed)
	default:
		return ""
	}
}
