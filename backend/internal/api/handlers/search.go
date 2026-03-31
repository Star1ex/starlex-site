package handlers

import (
	"github.com/Team-Tracks/team-track-site/internal/api/dto"
	"github.com/gofiber/fiber/v2"
)

// Swagger disabled: Summary      Search users
// Swagger disabled: Description  Search user by email
// Swagger disabled: Tags         search
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Param        email   path      string  true  "User Email"
// Swagger disabled: Success      200     {array}   dto.UserResponse
// Swagger disabled: Security BearerAuth
// Swagger disabled: Router       /search/{email} [get]
func (h *Handlers) Search(ctx *fiber.Ctx) error {
	_, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	email := ctx.Params("email")
	if email == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid email",
		})
	}

	users, err := h.userService.Search(ctx.Context(), email)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "not found user",
		})
	}

	response := dto.ToUsersResponse(users)

	return ctx.Status(fiber.StatusOK).JSON(response)
}
