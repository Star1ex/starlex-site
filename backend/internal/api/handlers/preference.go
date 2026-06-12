package handlers

import (
	"errors"

	"github.com/Star1ex/starlex-site/internal/api/dto"
	domainpreference "github.com/Star1ex/starlex-site/internal/domain/preference"
	"github.com/Star1ex/starlex-site/internal/logger"
	"github.com/gofiber/fiber/v2"
)

// GetUserPreferences godoc
// @Summary      Get user preferences
// @Description  Returns settings preferences for the authenticated user.
// @Tags         users
// @Produce      json
// @Success      200  {object}  dto.UserPreferencesResponse
// @Failure      401  {object}  map[string]string
// @Failure      500  {object}  map[string]string
// @Security     BearerAuth
// @Router       /users/preferences [get]
func (h *Handlers) GetUserPreferences(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	preferences, err := h.preferenceService.Get(ctx.Context(), userID)
	if err != nil {
		logger.Log.Errorw("get user preferences failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to load preferences"})
	}
	return ctx.Status(fiber.StatusOK).JSON(dto.ToUserPreferencesResponse(preferences))
}

// PatchUserPreferences godoc
// @Summary      Update user preferences
// @Description  Partially updates settings preferences for the authenticated user.
// @Tags         users
// @Accept       json
// @Produce      json
// @Param        preferences  body      dto.PatchUserPreferencesRequest  true  "Preference patch"
// @Success      200          {object}  dto.UserPreferencesResponse
// @Failure      400          {object}  map[string]string
// @Failure      401          {object}  map[string]string
// @Failure      500          {object}  map[string]string
// @Security     BearerAuth
// @Router       /users/preferences [patch]
func (h *Handlers) PatchUserPreferences(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	var req dto.PatchUserPreferencesRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	preferences, err := h.preferenceService.Patch(ctx.Context(), userID, dto.FromPatchUserPreferencesRequest(req))
	if err != nil {
		if isPreferenceValidationError(err) {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		logger.Log.Errorw("patch user preferences failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update preferences"})
	}
	return ctx.Status(fiber.StatusOK).JSON(dto.ToUserPreferencesResponse(preferences))
}

func isPreferenceValidationError(err error) bool {
	return errors.Is(err, domainpreference.ErrInvalidTheme) ||
		errors.Is(err, domainpreference.ErrInvalidAccentColor) ||
		errors.Is(err, domainpreference.ErrInvalidDensity) ||
		errors.Is(err, domainpreference.ErrInvalidWeekStart) ||
		errors.Is(err, domainpreference.ErrInvalidTimezone) ||
		errors.Is(err, domainpreference.ErrDefaultWorkspaceNotAccessible)
}
