package handlers

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"github.com/Team-Tracks/team-track-site/internal/security"
	"github.com/Team-Tracks/team-track-site/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

const csrfCookieName = "csrf_token"

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

type PasswordResetRequest struct {
	Email string `json:"email"`
}

type PasswordResetVerifyRequest struct {
	Email string `json:"email"`
	Token string `json:"token"`
	Code  string `json:"code"`
}

type PasswordResetConfirmRequest struct {
	Email       string `json:"email"`
	Token       string `json:"token"`
	Code        string `json:"code"`
	NewPassword string `json:"new_password"`
}

type CsrfTokenResponse struct {
	Token string `json:"csrf_token"`
}

func (h *Handlers) GetCSRFToken(ctx *fiber.Ctx) error {
	token, err := generateCSRFToken()
	if err != nil {
		log.Println("csrf token error:", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to generate csrf token",
		})
	}

	ctx.Cookie(&fiber.Cookie{
		Name:     csrfCookieName,
		Value:    token,
		Expires:  time.Now().Add(24 * time.Hour),
		HTTPOnly: false,
		Secure:   false,
		SameSite: "Lax",
		Path:     "/",
	})

	return ctx.Status(fiber.StatusOK).JSON(CsrfTokenResponse{Token: token})
}

func (h *Handlers) ChangePassword(ctx *fiber.Ctx) error {
	if err := requireCSRF(ctx); err != nil {
		return err
	}

	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	var req ChangePasswordRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	userEntity, err := h.userService.Get(ctx.Context(), userID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to load user",
		})
	}
	passwordRequired := userEntity.Password != ""
	if passwordRequired && (req.CurrentPassword == "" || req.NewPassword == "") {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "current password and new password are required",
		})
	}
	if !passwordRequired && req.NewPassword == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "new password is required",
		})
	}

	ip := ctx.IP()
	userAgent := ctx.Get("User-Agent")
	err := h.passwordService.ChangePassword(ctx.Context(), userID, req.CurrentPassword, req.NewPassword, ip, userAgent)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCurrentPass) {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "current password is incorrect",
			})
		}
		if errors.Is(err, service.ErrPasswordPolicyFailed) {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "password does not meet security requirements",
			})
		}
		log.Println("change password error:", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to change password",
		})
	}

	accessTokenStr, refreshTokenStr, err := h.issueTokens(userEntity)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to create session",
		})
	}

	ctx.Cookie(&fiber.Cookie{
		Name:     "refreshToken",
		Value:    refreshTokenStr,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
		HTTPOnly: true,
		Secure:   false,
		SameSite: "Lax",
		Path:     "/",
	})

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message":      "Password updated successfully",
		"access_token": accessTokenStr,
		"token":        accessTokenStr,
	})
}

func (h *Handlers) RequestPasswordReset(ctx *fiber.Ctx) error {
	if err := requireCSRF(ctx); err != nil {
		return err
	}

	var req PasswordResetRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	if req.Email == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "email is required",
		})
	}

	ip := ctx.IP()
	userAgent := ctx.Get("User-Agent")
	err := h.passwordService.RequestReset(ctx.Context(), req.Email, ip, userAgent)
	if err != nil {
		if errors.Is(err, service.ErrResetRateLimited) {
			return ctx.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"message": "If an account exists for that email, a reset code was sent. Please try again later.",
			})
		}
		log.Println("password reset request error:", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to process reset request",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "If an account exists for that email, a reset code was sent.",
	})
}

func (h *Handlers) VerifyPasswordReset(ctx *fiber.Ctx) error {
	if err := requireCSRF(ctx); err != nil {
		return err
	}

	var req PasswordResetVerifyRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	if req.Token == "" && req.Code == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "reset token or code is required",
		})
	}

	if req.Code != "" && req.Email == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "email is required when using a code",
		})
	}

	if err := h.passwordService.VerifyReset(ctx.Context(), req.Email, req.Token, req.Code); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid or expired reset code",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "reset code verified",
	})
}

func (h *Handlers) ResetPassword(ctx *fiber.Ctx) error {
	if err := requireCSRF(ctx); err != nil {
		return err
	}

	var req PasswordResetConfirmRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	if req.NewPassword == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "new password is required",
		})
	}

	if req.Token == "" && req.Code == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "reset token or code is required",
		})
	}

	if req.Code != "" && req.Email == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "email is required when using a code",
		})
	}

	ip := ctx.IP()
	userAgent := ctx.Get("User-Agent")
	if err := h.passwordService.ResetPassword(ctx.Context(), req.Email, req.Token, req.Code, req.NewPassword, ip, userAgent); err != nil {
		if errors.Is(err, service.ErrPasswordPolicyFailed) {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "password does not meet security requirements",
			})
		}
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid or expired reset token",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "password reset successfully",
	})
}

func (h *Handlers) issueTokens(userEntity *entity.User) (string, string, error) {
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"email":         userEntity.Email,
		"user_id":       userEntity.ID,
		"type":          "access",
		"token_version": userEntity.TokenVersion,
		"exp":           time.Now().Add(1 * time.Hour).Unix(),
	})
	accessTokenStr, err := accessToken.SignedString([]byte(h.jwtSecret))
	if err != nil {
		return "", "", fmt.Errorf("access token: %w", err)
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"email":         userEntity.Email,
		"user_id":       userEntity.ID,
		"type":          "refresh",
		"token_version": userEntity.TokenVersion,
		"exp":           time.Now().Add(7 * 24 * time.Hour).Unix(),
	})
	refreshTokenStr, err := refreshToken.SignedString([]byte(h.jwtSecret))
	if err != nil {
		return "", "", fmt.Errorf("refresh token: %w", err)
	}

	return accessTokenStr, refreshTokenStr, nil
}

func requireCSRF(ctx *fiber.Ctx) error {
	headerToken := ctx.Get("X-CSRF-Token")
	cookieToken := ctx.Cookies(csrfCookieName)
	if headerToken == "" || cookieToken == "" || headerToken != cookieToken {
		return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "invalid csrf token",
		})
	}
	return nil
}

func generateCSRFToken() (string, error) {
	return security.GenerateSecureToken(32)
}
