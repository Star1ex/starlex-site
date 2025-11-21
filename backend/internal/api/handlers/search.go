package handlers

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/api/dto"
	"github.com/gofiber/fiber/v2"
)

// @Summary      Search users
// @Description  Search user by email
// @Tags         search
// @Accept       json
// @Produce      json
// @Param        email   path      string  true  "User Email"
// @Success      200     {array}   dto.UserResponse
// @Router       /search/{email} [get]
func (h *Handlers) Search(ctx *fiber.Ctx) error {
	email := ctx.Params("email")
	if email == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid email",
		})
	}

	users, err := h.userService.Search(context.Background(), email)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "not found user",
		})
	}

	response := dto.ToUsersResponse(users)

	return ctx.Status(fiber.StatusOK).JSON(response)
}
