package handlers

import (
	"context"
	"errors"
	"fmt"
	"log"
	"regexp"
	"time"

	"github.com/Team-Tracks/team-track-site/internal/api/dto"
	"github.com/Team-Tracks/team-track-site/internal/repository"
	"github.com/Team-Tracks/team-track-site/internal/service"
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

// ДОДАНО: email validation helper
var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

// ДОДАНО: email validation helper
func validateEmail(email string) bool {
	return emailRegex.MatchString(email)
}

// ДОДАНО: security event logger
func (h *Handlers) logSecurityEvent(ctx *fiber.Ctx, userID, email, event, details string) {
	log.Printf("[SECURITY] Event=%s User=%s Email=%s IP=%s UserAgent=%s Details=%s",
		event, userID, email, ctx.IP(), ctx.Get("User-Agent"), details)
}

// Swagger disabled: Login godoc
// Swagger disabled: Summary      Auth
// Swagger disabled: Description  Auth if user created and verified
// Swagger disabled: Tags         auth
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Param        user            body      SignIn  true  "User data"
// Swagger disabled: Success      200  {object}   map[string]interface{}    "user auth successfully"
// Swagger disabled: Failure      400  {object}   map[string]string         "bad request"
// Swagger disabled: Failure      401  {object}   map[string]string         "unauthorized"
// Swagger disabled: Failure      403  {object}   map[string]string         "email not verified"
// Swagger disabled: Failure      500  {object}   map[string]string         "internal server error"
// Swagger disabled: Router       /auth/login [post]
func (h *Handlers) Login(ctx *fiber.Ctx) error {
	var loginInput SignIn

	if err := ctx.BodyParser(&loginInput); err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	// ДОДАНО: account lockout check
	lockKey := fmt.Sprintf("login_attempts:%s", loginInput.Email)
	attempts, _ := getLoginAttempts(lockKey)
	if attempts >= 5 {
		return ctx.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
			"error":       "account temporarily locked due to too many failed attempts",
			"retry_after": "15 minutes",
		})
	}

	user, err := h.userService.Login(ctx.Context(), loginInput.Email, loginInput.Password)
	if err != nil {
		log.Println(err)
		// ДОДАНО: increment failed attempts
		incrementLoginAttempts(lockKey, time.Minute*15)
		// ДОДАНО: log failed login
		h.logSecurityEvent(ctx, "", loginInput.Email, "LOGIN_FAILED", err.Error())
		if errors.Is(err, service.ErrPasswordNotSet) {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error":          "password not set for this account",
				"auth_providers": user.AuthProviders,
				"message":        "This email is linked to an OAuth provider. Please sign in with Google or GitHub to link a password.",
			})
		}
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

	// ДОДАНО: clear failed attempts on success
	clearLoginAttempts(lockKey)
	// ДОДАНО: log successful login
	h.logSecurityEvent(ctx, user.ID, user.Email, "LOGIN_SUCCESS", "")

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

	// Set refresh token in httpOnly cookie (secure for production)
	h.setRefreshCookie(ctx, refreshTokenStr)

	// Return access token and user data
	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"access_token": accessTokenStr,
		"token":        accessTokenStr, // For backward compatibility
		"user":         dto.ToUserResponse(user),
	})
}

// Swagger disabled: Refresh godoc
// Swagger disabled: Summary      Refresh Access Token
// Swagger disabled: Description  Refresh access token using refresh token
// Swagger disabled: Tags         auth
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Param        request         body      RefreshTokenRequest  true  "Refresh token data"
// Swagger disabled: Success      200  {object}   map[string]string    "access token refreshed successfully"
// Swagger disabled: Failure      400  {object}   map[string]string    "bad request"
// Swagger disabled: Failure      401  {object}   map[string]string    "invalid or expired refresh token"
// Swagger disabled: Router       /auth/refresh [post]
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

// Swagger disabled: Register godoc
// Swagger disabled: Summary      Register
// Swagger disabled: Description  Register new user and send verification email
// Swagger disabled: Tags         auth
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Param        user            body      dto.UserApi  true  "User data"
// Swagger disabled: Success      201  {object}   map[string]interface{}    "user created successfully"
// Swagger disabled: Failure      400  {object}   map[string]string         "bad request"
// Swagger disabled: Failure      500  {object}   map[string]string         "internal server error"
// Swagger disabled: Router       /auth/register [post]
func (h *Handlers) Register(ctx *fiber.Ctx) error {
	var input dto.UserApi

	if err := ctx.BodyParser(&input); err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// ДОДАНО: email format validation
	if !validateEmail(input.Email) {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid email format",
		})
	}

	if input.Email == "" || input.Password == "" || input.FirstName == "" || input.LastName == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "All fields are required",
		})
	}

	existingUser, err := h.userService.GetByEmail(ctx.Context(), input.Email)
	if err == nil && existingUser != nil {
		if existingUser.Password == "" {
			return ctx.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error":          "email already registered with oauth",
				"auth_providers": existingUser.AuthProviders,
				"message":        "Email already registered with Google or GitHub. Would you like to link accounts?",
			})
		}
		return ctx.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error":   "email already registered",
			"message": "Email already registered. Please sign in.",
		})
	}
	if err != nil && !errors.Is(err, repository.ErrUserNotFound) {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to validate user",
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

// Swagger disabled: VerifyEmail godoc
// Swagger disabled: Summary      Verify Email
// Swagger disabled: Description  Verify user email with code
// Swagger disabled: Tags         auth
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Param        request         body      VerifyEmailRequest  true  "Verification data"
// Swagger disabled: Success      200  {object}   map[string]string    "email verified successfully"
// Swagger disabled: Failure      400  {object}   map[string]string    "bad request"
// Swagger disabled: Failure      500  {object}   map[string]string    "internal server error"
// Swagger disabled: Router       /auth/verify [post]
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

// Swagger disabled: ResendCode godoc
// Swagger disabled: Summary      Resend Verification Code
// Swagger disabled: Description  Resend verification code to user email
// Swagger disabled: Tags         auth
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Param        request         body      ResendCodeRequest  true  "User ID"
// Swagger disabled: Success      200  {object}   map[string]string    "code resent successfully"
// Swagger disabled: Failure      400  {object}   map[string]string    "bad request"
// Swagger disabled: Failure      500  {object}   map[string]string    "internal server error"
// Swagger disabled: Router       /auth/resend-code [post]
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
