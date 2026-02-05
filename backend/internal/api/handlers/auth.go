package handlers

import (
	"context"
	"fmt"
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

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type VerifyEmailRequest struct {
	UserID string `json:"user_id" binding:"required"`
	Code   string `json:"code" binding:"required"`
}

type ResendCodeRequest struct {
	UserID string `json:"user_id" binding:"required"`
}

// Login method

// Login godoc:
// @Summary      Auth
// @Description  Auth if user created and verified
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        user            body      SignIn  true  "User data"
// @Success      200  {object}   map[string]interface{}    "user auth successfully"
// @Failure      400  {object}   map[string]string         "bad request"
// @Failure      401  {object}   map[string]string         "unauthorized"
// @Failure      403  {object}   map[string]string         "email not verified"
// @Failure      500  {object}   map[string]string         "internal server error"
// @Router       /auth/login [post]
func (h *Handlers) Login(ctx *fiber.Ctx) error {
	var loginInput SignIn

	if err := ctx.BodyParser(&loginInput); err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	user, err := h.userService.Login(ctx.Context(), loginInput.Email, loginInput.Password)
	if err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid email or password",
		})
	}

	if !user.IsVerified {
		return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error":   "Email not verified",
			"user_id": user.ID,
			"message": "Please verify your email before login in",
		})
	}

	// Generate access token - short-lived (1 hour)
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"email":         loginInput.Email,
		"user_id":       user.ID,
		"type":          "access",
		"token_version": user.TokenVersion,
		"exp":           time.Now().Add(1 * time.Hour).Unix(),
	})

	accessTokenStr, err := accessToken.SignedString([]byte(h.jwtSecret))
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to generate access token")
	}

	// Generate refresh token - long-lived (7 days)
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"email":         loginInput.Email,
		"user_id":       user.ID,
		"type":          "refresh",
		"token_version": user.TokenVersion,
		"exp":           time.Now().Add(7 * 24 * time.Hour).Unix(),
	})

	refreshTokenStr, err := refreshToken.SignedString([]byte(h.jwtSecret))
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to generate refresh token")
	}

	// Set refresh token in httpOnly cookie (secure and httpOnly for production)
	ctx.Cookie(&fiber.Cookie{
		Name:     "refreshToken",
		Value:    refreshTokenStr,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
		HTTPOnly: true,
		Secure:   false, // Set to true in production with HTTPS
		SameSite: "Lax",
		Path:     "/",
	})

	// Return access token and user data
	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"access_token": accessTokenStr,
		"token":        accessTokenStr, // For backward compatibility
		"user":         dto.ToUserResponse(user),
	})
}

// Refresh godoc:
// @Summary      Refresh Access Token
// @Description  Refresh access token using refresh token
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request         body      RefreshTokenRequest  true  "Refresh token data"
// @Success      200  {object}   map[string]string    "access token refreshed successfully"
// @Failure      400  {object}   map[string]string    "bad request"
// @Failure      401  {object}   map[string]string    "invalid or expired refresh token"
// @Router       /auth/refresh [post]
func (h *Handlers) Refresh(ctx *fiber.Ctx) error {
	// Try to get refresh token from cookie first, then from request body
	refreshTokenStr := ctx.Cookies("refreshToken")

	if refreshTokenStr == "" {
		var req RefreshTokenRequest
		if err := ctx.BodyParser(&req); err == nil && req.RefreshToken != "" {
			refreshTokenStr = req.RefreshToken
		}
	}

	if refreshTokenStr == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "missing refresh token",
		})
	}

	// Parse and validate refresh token
	token, err := jwt.Parse(refreshTokenStr, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fiber.NewError(fiber.StatusUnauthorized, "invalid token signing method")
		}
	return []byte(h.jwtSecret), nil
	})

	if err != nil || !token.Valid {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid or expired refresh token",
		})
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid token claims",
		})
	}

	// Verify token type
	tokenType, ok := claims["type"].(string)
	if !ok || tokenType != "refresh" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid token type",
		})
	}

	// Check expiration
	if exp, ok := claims["exp"].(float64); ok && int64(exp) < time.Now().Unix() {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "refresh token expired",
		})
	}

	userID, ok := claims["user_id"]
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "missing user_id in token",
		})
	}

	email, _ := claims["email"].(string)

	tokenVersionClaim, ok := claims["token_version"].(float64)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid token version",
		})
	}

	currentVersion, err := h.userService.GetTokenVersion(ctx.Context(), fmt.Sprintf("%v", userID))
	if err != nil || int(tokenVersionClaim) != currentVersion {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "refresh token invalidated",
		})
	}

	// Generate new access token
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"email":         email,
		"user_id":       userID,
		"type":          "access",
		"token_version": tokenVersionClaim,
		"exp":           time.Now().Add(1 * time.Hour).Unix(),
	})

	accessTokenStr, err := accessToken.SignedString([]byte(h.jwtSecret))
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to generate access token")
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"access_token": accessTokenStr,
	})
}

// Register method

// Register godoc
// @Summary      Register
// @Description  Register new user and send verification email
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        user            body      dto.UserApi  true  "User data"
// @Success      201  {object}   map[string]interface{}    "user created successfully"
// @Failure      400  {object}   map[string]string         "bad request"
// @Failure      500  {object}   map[string]string         "internal server error"
// @Router       /auth/register [post]
func (h *Handlers) Register(ctx *fiber.Ctx) error {
	var input dto.UserApi

	if err := ctx.BodyParser(&input); err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	if input.Email == "" || input.Password == "" || input.FirstName == "" || input.LastName == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "All fields are required",
		})
	}

	userID, err := h.userService.CreateUnverified(context.Background(), &input)
	if err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create user",
		})
	}
	// create user with service
	err = h.verificationService.GenerateAndSendCode(context.Background(), userID, input.Email, input.FirstName)
	if err != nil {
		log.Println("Failed to send verification code: ", err)
		ctx.Status(fiber.StatusCreated).JSON(fiber.Map{
			"message": "User registered. Please contact support for verification code.",
			"user_id": userID,
		})
	}

	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Registration successful. Please check your email for verification code.",
		"user_id": userID,
	})
}

// VerifyEmail godoc
// @Summary      Verify Email
// @Description  Verify user email with code
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request         body      VerifyEmailRequest  true  "Verification data"
// @Success      200  {object}   map[string]string    "email verified successfully"
// @Failure      400  {object}   map[string]string    "bad request"
// @Failure      500  {object}   map[string]string    "internal server error"
// @Router       /auth/verify [post]
func (h *Handlers) VerifyEmail(ctx *fiber.Ctx) error {
	var input VerifyEmailRequest
	if err := ctx.BodyParser(&input); err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if input.UserID == "" || input.Code == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "User ID and code are required",
		})
	}

	err := h.verificationService.VerifyCode(context.Background(), input.UserID, input.Code)
	if err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	user, err := h.userService.Get(context.Background(), input.UserID)
	if err != nil {
		log.Println("Failed to get user for notification: ", err)
	} else {
		h.notifyUserRegistered(dto.ToUserResponseIsVerified(user))
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Email verified successfully. You can now log in",
	})
}

func (h *Handlers) notifyUserRegistered(user *dto.User) {

	// impl needs
}

// ResendCode godoc
// @Summary      Resend Verification Code
// @Description  Resend verification code to user email
// @Tags         auth
// @Accept       json
// @Produce      json
// @Param        request         body      ResendCodeRequest  true  "User ID"
// @Success      200  {object}   map[string]string    "code resent successfully"
// @Failure      400  {object}   map[string]string    "bad request"
// @Failure      500  {object}   map[string]string    "internal server error"
// @Router       /auth/resend-code [post]
func (h *Handlers) ResendCode(ctx *fiber.Ctx) error {
	var input ResendCodeRequest
	if err := ctx.BodyParser(&input); err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if input.UserID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "User ID is required",
		})
	}

	user, err := h.userService.Get(context.Background(), input.UserID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "user not found",
		})
	}

	if user.IsVerified {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email is already verified",
		})
	}

	err = h.verificationService.GenerateAndSendCode(context.Background(), user.ID, user.Email, user.FirstName)
	if err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to resend verification code",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Verification code resent successfully",
	})

}
