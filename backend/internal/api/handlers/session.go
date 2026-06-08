package handlers

import (
	"strings"

	"github.com/Star1ex/starlex-site/internal/api/dto"
	domainSession "github.com/Star1ex/starlex-site/internal/domain/session"
	"github.com/gofiber/fiber/v2"
)

// GetSessions godoc
// @Summary      List active sessions
// @Description  Returns active device-bound sessions for the authenticated user.
// @Tags         auth
// @Produce      json
// @Success      200  {array}   dto.SessionResponse
// @Failure      401  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Security     BearerAuth
// @Router       /auth/sessions [get]
func (h *Handlers) GetSessions(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	currentSessionID := h.currentSessionID(ctx)
	sessions, err := h.sessionService.ListActiveByUser(ctx.Context(), userID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to load sessions",
		})
	}

	response := make([]dto.SessionResponse, len(sessions))
	for i, sessionEntity := range sessions {
		response[i] = toSessionResponse(sessionEntity, sessionEntity.ID == currentSessionID)
	}
	return ctx.Status(fiber.StatusOK).JSON(response)
}

// DeleteSession godoc
// @Summary      Revoke a session
// @Description  Revokes one active device-bound session owned by the authenticated user.
// @Tags         auth
// @Produce      json
// @Param        id   path      string  true  "Session ID"
// @Success      204
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Security     BearerAuth
// @Router       /auth/sessions/{id} [delete]
func (h *Handlers) DeleteSession(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	sessionID := ctx.Params("id")
	sessionEntity, err := h.sessionService.FindByID(ctx.Context(), sessionID)
	if err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "session not found"})
	}
	if sessionEntity.UserID != userID {
		return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "session does not belong to user"})
	}

	currentSessionID := h.currentSessionID(ctx)
	if err := h.sessionService.Revoke(ctx.Context(), sessionID); err != nil {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "session not found"})
	}
	if sessionID == currentSessionID {
		h.clearSessionCookies(ctx)
	}

	return ctx.SendStatus(fiber.StatusNoContent)
}

func (h *Handlers) currentSessionID(ctx *fiber.Ctx) string {
	deviceID := strings.TrimSpace(ctx.Cookies(deviceCookieName))
	refreshTokenStr := ctx.Cookies(refreshCookieName)
	if deviceID == "" || refreshTokenStr == "" {
		return ""
	}
	sessionEntity, err := h.sessionService.FindByDeviceRefreshToken(ctx.Context(), deviceID, refreshTokenStr)
	if err != nil {
		return ""
	}
	return sessionEntity.ID
}

func toSessionResponse(sessionEntity *domainSession.Session, current bool) dto.SessionResponse {
	return dto.SessionResponse{
		ID:          sessionEntity.ID,
		DeviceLabel: deviceLabel(sessionEntity.UserAgent),
		UserAgent:   sessionEntity.UserAgent,
		IP:          sessionEntity.IP,
		CreatedAt:   sessionEntity.CreatedAt,
		LastSeenAt:  sessionEntity.LastSeenAt,
		ExpiresAt:   sessionEntity.ExpiresAt,
		Current:     current,
	}
}

func deviceLabel(userAgent string) string {
	ua := strings.ToLower(userAgent)
	browser := "Browser"
	switch {
	case strings.Contains(ua, "edg/"):
		browser = "Edge"
	case strings.Contains(ua, "chrome/"):
		browser = "Chrome"
	case strings.Contains(ua, "firefox/"):
		browser = "Firefox"
	case strings.Contains(ua, "safari/"):
		browser = "Safari"
	}

	osName := "Unknown device"
	switch {
	case strings.Contains(ua, "windows"):
		osName = "Windows"
	case strings.Contains(ua, "mac os") || strings.Contains(ua, "macintosh"):
		osName = "macOS"
	case strings.Contains(ua, "iphone") || strings.Contains(ua, "ipad"):
		osName = "iOS"
	case strings.Contains(ua, "android"):
		osName = "Android"
	case strings.Contains(ua, "linux"):
		osName = "Linux"
	}
	return browser + " on " + osName
}
