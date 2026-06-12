package handlers

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/Star1ex/starlex-site/internal/api/dto"
	"github.com/Star1ex/starlex-site/internal/domain/entity"
	"github.com/Star1ex/starlex-site/internal/logger"
	"github.com/Star1ex/starlex-site/internal/repository"
	"github.com/Star1ex/starlex-site/internal/service"
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
	Email string `json:"email" binding:"required"`
	Code  string `json:"code" binding:"required"`
}

type ResendCodeRequest struct {
	Email string `json:"email" binding:"required"`
}

// Login method
var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)

func validateEmail(email string) bool {
	return emailRegex.MatchString(email)
}

func (h *Handlers) logSecurityEvent(ctx *fiber.Ctx, userID, email, event, details string) {
	logger.Log.Infow("security event",
		"event", event,
		"user_id", userID,
		"email", email,
		"ip", ctx.IP(),
		"user_agent", ctx.Get("User-Agent"),
		"details", details,
	)
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
		logger.Log.Errorw("login body parse failed", "error", err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

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
		logger.Log.Errorw("login failed", "error", err)
		incrementLoginAttempts(lockKey, time.Minute*15)
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

	clearLoginAttempts(lockKey)
	h.logSecurityEvent(ctx, user.ID, user.Email, "LOGIN_SUCCESS", "")

	// Record minimal login metadata (non-fatal on failure).
	if err := h.userService.RecordLogin(ctx.Context(), user.ID, ctx.IP()); err != nil {
		logger.Log.Warnw("failed to record login metadata", "user_id", user.ID, "error", err)
	}

	accessTokenStr, err := h.issueDeviceSession(ctx, user)
	if err != nil {
		logger.Log.Errorw("login session create failed", "user_id", user.ID, "error", err)
		return fiber.NewError(fiber.StatusInternalServerError, "failed to create session")
	}

	needsOnboarding, err := h.needsOnboarding(ctx, user.ID)
	if err != nil {
		logger.Log.Errorw("login onboarding check failed", "user_id", user.ID, "error", err)
		return fiber.NewError(fiber.StatusInternalServerError, "failed to load workspaces")
	}

	// Return access token and user data
	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"access_token":     accessTokenStr,
		"token":            accessTokenStr, // For backward compatibility
		"needs_onboarding": needsOnboarding,
		"user":             dto.ToUserResponse(user),
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
	deviceID := strings.TrimSpace(ctx.Cookies(deviceCookieName))
	if deviceID == "" {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "missing device",
		})
	}

	refreshTokenStr := ctx.Cookies(refreshCookieName)

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

	currentSession, err := h.sessionService.FindByDeviceRefreshToken(ctx.Context(), deviceID, refreshTokenStr)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid or expired refresh token",
		})
	}

	claims, err := h.parseRefreshClaims(refreshTokenStr)
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid or expired refresh token",
		})
	}

	userID, err := claimString(claims, "user_id")
	if err != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "missing user_id in token",
		})
	}
	if currentSession.UserID != userID {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid refresh token session",
		})
	}

	email, _ := claimString(claims, "email")

	tokenVersionClaim, ok := claims["token_version"].(float64)
	if !ok {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid token version",
		})
	}

	currentVersion, err := h.userService.GetTokenVersion(ctx.Context(), userID)
	if err != nil || int(tokenVersionClaim) != currentVersion {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "refresh token invalidated",
		})
	}

	userEntity := &entity.User{
		ID:           userID,
		Email:        email,
		TokenVersion: currentVersion,
	}
	accessTokenStr, err := h.issueAccessToken(userEntity)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to generate access token")
	}

	refreshExpiresAt := time.Now().Add(refreshTokenTTL)
	newRefreshToken, err := h.issueRefreshToken(userEntity, refreshExpiresAt)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to generate refresh token")
	}
	if err := h.sessionService.RotateRefreshToken(ctx.Context(), currentSession.ID, newRefreshToken, refreshExpiresAt); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "failed to rotate refresh token")
	}
	h.setRefreshCookie(ctx, newRefreshToken, refreshExpiresAt)

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"access_token": accessTokenStr,
	})
}

func (h *Handlers) Logout(ctx *fiber.Ctx) error {
	deviceID := strings.TrimSpace(ctx.Cookies(deviceCookieName))
	refreshTokenStr := ctx.Cookies(refreshCookieName)
	if deviceID != "" && refreshTokenStr != "" {
		if currentSession, err := h.sessionService.FindByDeviceRefreshToken(ctx.Context(), deviceID, refreshTokenStr); err == nil {
			_ = h.sessionService.Revoke(ctx.Context(), currentSession.ID)
		}
	}

	h.clearSessionCookies(ctx)

	return ctx.SendStatus(fiber.StatusNoContent)
}

func (h *Handlers) parseRefreshClaims(refreshTokenStr string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(refreshTokenStr, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fiber.NewError(fiber.StatusUnauthorized, "invalid token signing method")
		}
		return []byte(h.jwtSecret), nil
	})
	if err != nil || token == nil || !token.Valid {
		return nil, errors.New("invalid refresh token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	tokenType, ok := claims["type"].(string)
	if !ok || tokenType != "refresh" {
		return nil, errors.New("invalid token type")
	}

	if exp, ok := claims["exp"].(float64); ok && int64(exp) < time.Now().Unix() {
		return nil, errors.New("refresh token expired")
	}

	return claims, nil
}

func claimString(claims jwt.MapClaims, key string) (string, error) {
	raw, ok := claims[key]
	if !ok || raw == nil {
		return "", errors.New("missing claim")
	}
	switch v := raw.(type) {
	case string:
		return strings.TrimSpace(v), nil
	case float64:
		return fmt.Sprintf("%.0f", v), nil
	default:
		return fmt.Sprintf("%v", v), nil
	}
}

func (h *Handlers) needsOnboarding(ctx *fiber.Ctx, userID string) (bool, error) {
	workspaces, err := h.userService.GetWorkspaces(ctx.Context(), userID)
	if err != nil {
		return false, err
	}
	return len(workspaces) == 0, nil
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
		logger.Log.Errorw("register body parse failed", "error", err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

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

	// Only reject if a real (already created) account exists for this email.
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

	// No user is created yet — the account is only persisted after the email is
	// verified. Store a pending registration and email the code.
	if err := h.registrationService.Start(ctx.Context(), input.Email, input.Password, input.FirstName, input.LastName, ctx.IP()); err != nil {
		logger.Log.Errorw("start registration failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to start registration",
		})
	}

	h.ensureDeviceID(ctx)

	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{
		"pending": true,
		"email":   input.Email,
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
		logger.Log.Errorw("verify email body parse failed", "error", err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if input.Email == "" || input.Code == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email and code are required",
		})
	}

	// Confirm creates the verified user from the pending registration.
	user, err := h.registrationService.Confirm(ctx.Context(), input.Email, input.Code, ctx.IP())
	if err != nil {
		logger.Log.Errorw("verify email failed", "error", err)
		status := fiber.StatusBadRequest
		message := "invalid verification code"
		response := fiber.Map{"error": message}
		switch {
		case errors.Is(err, service.ErrPendingNotFound):
			message = "no pending registration for this email"
		case errors.Is(err, service.ErrCodeExpired):
			message = "verification code expired, please register again"
		case errors.Is(err, service.ErrTooManyAttempts):
			message = "too many attempts, please register again"
		default:
			var invalidCode service.InvalidCodeError
			if errors.As(err, &invalidCode) {
				response["remaining_attempts"] = invalidCode.RemainingAttempts
			}
		}
		response["error"] = message
		return ctx.Status(status).JSON(response)
	}

	h.notifyUserRegistered(dto.ToUserResponseIsVerified(user))

	accessTokenStr, err := h.issueDeviceSession(ctx, user)
	if err != nil {
		logger.Log.Errorw("verify session create failed", "user_id", user.ID, "error", err)
		return fiber.NewError(fiber.StatusInternalServerError, "failed to create session")
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"access_token":     accessTokenStr,
		"token":            accessTokenStr,
		"needs_onboarding": true,
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
		logger.Log.Errorw("resend code body parse failed", "error", err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if input.Email == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email is required",
		})
	}

	if err := h.registrationService.Resend(ctx.Context(), input.Email); err != nil {
		logger.Log.Errorw("resend code failed", "error", err)
		if errors.Is(err, service.ErrPendingNotFound) {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "no pending registration for this email",
			})
		}
		var cooldown service.ResendCooldownError
		if errors.As(err, &cooldown) {
			return ctx.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error":               "verification code resend cooldown",
				"retry_after_seconds": int(cooldown.RetryAfter.Seconds()),
			})
		}
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to resend verification code",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Verification code resent successfully",
	})

}
