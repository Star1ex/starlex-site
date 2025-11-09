package handlers

import (
	"github.com/Team-Tracks/team-track-site/internal/api/dto"
	"github.com/gofiber/fiber/v2"
)

type SignIn struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func (h *Handlers) Login(ctx *fiber.Ctx) error {
	return nil
}

func (h *Handlers) Register(ctx *fiber.Ctx) error {

	var input dto.UserApi

	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{})
	}
	return nil
}
