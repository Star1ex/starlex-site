package handlers

import (
	"log"
	"time"

	"github.com/Team-Tracks/team-track-site/internal/api/dto"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

type SignIn struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// Login method

// Login godoc:
// @Summary      Auth
// @Description  Auth if user created
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        user            body      SignIn  true  "User data"
// @Success      201  {object}   map[string]interface{}    "user auth successfuly"
// @Failure      400  {object}   map[string]string         "bad request"
// @Failure      500  {object}   map[string]string         "internal server error"
// @Router       /auth/login [post]
func (h *Handlers) Login(ctx *fiber.Ctx) error {
	var loginInput SignIn

	if err := ctx.BodyParser(&loginInput); err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{})
	}

	user, err := h.userService.Login(ctx.Context(), loginInput.Email, loginInput.Password)
	if err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid credentials",
		})
	}

	// Generater new token with paramaters and add expired time 24 hours
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"email":   loginInput.Email,
		"user_id": user.ID,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	})

	// Hash the token
	tokenStr, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to generate token")
	}

	// Return token, user
	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{"token": tokenStr, "user": dto.ToUserResponse(user)})
}

// Register method

// Register godoc
// @Summary      Register
// @Description  Register new user
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        user            body      dto.UserApi  true  "User data"
// @Success      201  {object}   map[string]interface{}    "user created successfuly"
// @Failure      400  {object}   map[string]string         "bad request"
// @Failure      500  {object}   map[string]string         "internal server error"
// @Router       /auth/register [post]
func (h *Handlers) Register(ctx *fiber.Ctx) error {

	var input dto.UserApi
	if err := ctx.BodyParser(&input); err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{})
	}

	// create user with service
	err := h.userService.Create(ctx.Context(), &input)
	if err != nil {
		log.Println(err)
		ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to authenticate user",
		})
	}
	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "User registered successfully",
	})
}
