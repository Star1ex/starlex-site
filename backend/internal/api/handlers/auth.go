package handlers

import (
	"log"

	"github.com/Team-Tracks/team-track-site/internal/api/dto"
	"github.com/gofiber/fiber/v2"
)

type SignIn struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// Login method
func (h *Handlers) Login(ctx *fiber.Ctx) error {
	var loginInput SignIn

	if err := ctx.BodyParser(&loginInput); err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{})
	}

	user, err := h.service.GetByEmail(ctx.Context(), loginInput.Email)
	if err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to authenticate user",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"user": dto.ToUserApi(user),
	})
}

// Register method
func (h *Handlers) Register(ctx *fiber.Ctx) error {

	var input dto.UserApi

	if err := ctx.BodyParser(&input); err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{})
	}

	// create user with service
	err := h.service.Create(ctx.Context(), dto.FromUserApi(&input))
	if err != nil {
		log.Println(err)
		ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "failed to authenticate user",
		})
	}
	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "User registered successfully",
	})
}
