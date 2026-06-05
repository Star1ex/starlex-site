package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	"github.com/Star1ex/starlex-site/internal/domain/passwordaudit"
	"github.com/Star1ex/starlex-site/internal/domain/passwordreset"
	"github.com/Star1ex/starlex-site/internal/domain/user"
	email "github.com/Star1ex/starlex-site/internal/infra/email"
	"github.com/Star1ex/starlex-site/internal/security"
)

const (
	resetTokenExpiryMinutes = 30
	resetRateLimitMax       = 5
	resetRateLimitWindow    = time.Hour
	resetCodeLength         = 6

	actionResetRequest = "password_reset_request"
	actionResetConfirm = "password_reset"
	actionChange       = "password_change"
)

var (
	ErrResetRateLimited     = errors.New("reset request rate limited")
	ErrInvalidResetToken    = errors.New("invalid or expired reset token")
	ErrInvalidCurrentPass   = errors.New("invalid current password")
	ErrPasswordPolicyFailed = errors.New("password policy failed")
)

type PasswordService struct {
	userRepo        user.Repository
	resetRepo       passwordreset.Repository
	auditRepo       passwordaudit.Repository
	emailService    *email.EmailService
	frontendBaseURL string
}

func NewPasswordService(
	userRepo user.Repository,
	resetRepo passwordreset.Repository,
	auditRepo passwordaudit.Repository,
	emailService *email.EmailService,
	frontendBaseURL string,
) *PasswordService {
	return &PasswordService{
		userRepo:        userRepo,
		resetRepo:       resetRepo,
		auditRepo:       auditRepo,
		emailService:    emailService,
		frontendBaseURL: strings.TrimRight(frontendBaseURL, "/"),
	}
}

func (s *PasswordService) RequestReset(ctx context.Context, email, ip, userAgent string) error {
	normalizedEmail := normalizeEmail(email)
	if normalizedEmail == "" {
		return nil
	}

	count, err := s.auditRepo.CountByEmailSince(ctx, normalizedEmail, actionResetRequest, time.Now().Add(-resetRateLimitWindow))
	if err != nil {
		return err
	}
	if count >= resetRateLimitMax {
		_ = s.logAudit(ctx, "", normalizedEmail, actionResetRequest, false, "rate_limited", ip, userAgent)
		return ErrResetRateLimited
	}

	userEntity, err := s.userRepo.GetByEmail(ctx, normalizedEmail)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			_ = s.logAudit(ctx, "", normalizedEmail, actionResetRequest, true, "email_not_found", ip, userAgent)
			return nil
		}
		_ = s.logAudit(ctx, "", normalizedEmail, actionResetRequest, false, "lookup_failed", ip, userAgent)
		return err
	}

	token, code, tokenHash, codeHash, err := generateResetCredentials()
	if err != nil {
		_ = s.logAudit(ctx, userEntity.ID, normalizedEmail, actionResetRequest, false, "token_generation_failed", ip, userAgent)
		return err
	}

	expiresAt := time.Now().Add(time.Minute * resetTokenExpiryMinutes)
	resetToken := entity.NewPasswordResetToken(
		security.GenerateNewID(),
		userEntity.ID,
		normalizedEmail,
		tokenHash,
		codeHash,
		ip,
		userAgent,
		expiresAt,
	)

	if err := s.resetRepo.Create(ctx, resetToken); err != nil {
		_ = s.logAudit(ctx, userEntity.ID, normalizedEmail, actionResetRequest, false, "token_persist_failed", ip, userAgent)
		return err
	}

	resetLink := ""
	if s.frontendBaseURL != "" {
		resetLink = fmt.Sprintf("%s/reset-password?token=%s", s.frontendBaseURL, token)
	}

	if err := s.emailService.SendPasswordResetEmail(userEntity.Email, userEntity.FirstName, code, resetLink, resetTokenExpiryMinutes); err != nil {
		_ = s.logAudit(ctx, userEntity.ID, normalizedEmail, actionResetRequest, false, "email_send_failed", ip, userAgent)
		return err
	}

	_ = s.logAudit(ctx, userEntity.ID, normalizedEmail, actionResetRequest, true, "", ip, userAgent)
	return nil
}

func (s *PasswordService) VerifyReset(ctx context.Context, email, token, code string) error {
	_, err := s.findValidResetToken(ctx, email, token, code)
	return err
}

func (s *PasswordService) ResetPassword(ctx context.Context, email, token, code, newPassword, ip, userAgent string) error {
	resetToken, err := s.findValidResetToken(ctx, email, token, code)
	if err != nil {
		_ = s.logAudit(ctx, "", normalizeEmail(email), actionResetConfirm, false, "invalid_token", ip, userAgent)
		return err
	}

	if err := security.ValidatePassword(newPassword); err != nil {
		_ = s.logAudit(ctx, resetToken.UserID, resetToken.Email, actionResetConfirm, false, "password_policy_failed", ip, userAgent)
		return ErrPasswordPolicyFailed
	}

	userEntity, err := s.userRepo.Get(ctx, resetToken.UserID)
	if err != nil {
		_ = s.logAudit(ctx, resetToken.UserID, resetToken.Email, actionResetConfirm, false, "user_not_found", ip, userAgent)
		return err
	}

	hashedPassword, err := security.HashPassword(newPassword)
	if err != nil {
		_ = s.logAudit(ctx, resetToken.UserID, resetToken.Email, actionResetConfirm, false, "hash_failed", ip, userAgent)
		return err
	}

	newTokenVersion := userEntity.TokenVersion + 1
	if newTokenVersion == 0 {
		newTokenVersion = 1
	}

	if err := s.userRepo.UpdatePasswordAndTokenVersion(ctx, userEntity.ID, hashedPassword, newTokenVersion); err != nil {
		_ = s.logAudit(ctx, userEntity.ID, userEntity.Email, actionResetConfirm, false, "update_failed", ip, userAgent)
		return err
	}

	if err := s.resetRepo.MarkAsUsed(ctx, resetToken.ID); err != nil {
		_ = s.logAudit(ctx, userEntity.ID, userEntity.Email, actionResetConfirm, false, "mark_used_failed", ip, userAgent)
		return err
	}

	if err := s.emailService.SendPasswordResetConfirmation(userEntity.Email, userEntity.FirstName); err != nil {
		_ = s.logAudit(ctx, userEntity.ID, userEntity.Email, actionResetConfirm, true, "email_send_failed", ip, userAgent)
		return nil
	}

	_ = s.logAudit(ctx, userEntity.ID, userEntity.Email, actionResetConfirm, true, "", ip, userAgent)
	return nil
}

func (s *PasswordService) ChangePassword(ctx context.Context, userID, currentPassword, newPassword, ip, userAgent string) error {
	userEntity, err := s.userRepo.Get(ctx, userID)
	if err != nil {
		_ = s.logAudit(ctx, userID, "", actionChange, false, "user_not_found", ip, userAgent)
		return err
	}

	if userEntity.Password != "" {
		ok, err := security.VerifyPassword(userEntity.Password, currentPassword)
		if err != nil || !ok {
			_ = s.logAudit(ctx, userID, userEntity.Email, actionChange, false, "invalid_current_password", ip, userAgent)
			return ErrInvalidCurrentPass
		}
	}

	if currentPassword != "" && currentPassword == newPassword {
		_ = s.logAudit(ctx, userID, userEntity.Email, actionChange, false, "password_reused", ip, userAgent)
		return ErrPasswordPolicyFailed
	}

	if err := security.ValidatePassword(newPassword); err != nil {
		_ = s.logAudit(ctx, userID, userEntity.Email, actionChange, false, "password_policy_failed", ip, userAgent)
		return ErrPasswordPolicyFailed
	}

	hashedPassword, err := security.HashPassword(newPassword)
	if err != nil {
		_ = s.logAudit(ctx, userID, userEntity.Email, actionChange, false, "hash_failed", ip, userAgent)
		return err
	}

	newTokenVersion := userEntity.TokenVersion + 1
	if newTokenVersion == 0 {
		newTokenVersion = 1
	}

	if err := s.userRepo.UpdatePasswordAndTokenVersion(ctx, userEntity.ID, hashedPassword, newTokenVersion); err != nil {
		_ = s.logAudit(ctx, userID, userEntity.Email, actionChange, false, "update_failed", ip, userAgent)
		return err
	}

	if err := s.emailService.SendPasswordChangedConfirmation(userEntity.Email, userEntity.FirstName); err != nil {
		_ = s.logAudit(ctx, userID, userEntity.Email, actionChange, true, "email_send_failed", ip, userAgent)
		return nil
	}

	_ = s.logAudit(ctx, userID, userEntity.Email, actionChange, true, "", ip, userAgent)
	return nil
}

func (s *PasswordService) CleanupExpiredTokens(ctx context.Context) (int64, error) {
	return s.resetRepo.DeleteExpired(ctx, time.Now().Unix())
}

func (s *PasswordService) findValidResetToken(ctx context.Context, email, token, code string) (*entity.PasswordResetToken, error) {
	normalizedEmail := normalizeEmail(email)
	if token == "" && code == "" {
		return nil, ErrInvalidResetToken
	}

	var resetToken *entity.PasswordResetToken
	var err error
	if token != "" {
		resetToken, err = s.resetRepo.GetByTokenHash(ctx, hashToken(token))
	} else {
		resetToken, err = s.resetRepo.GetByCodeHash(ctx, normalizedEmail, hashToken(code))
	}
	if err != nil {
		return nil, ErrInvalidResetToken
	}

	if normalizedEmail != "" && !strings.EqualFold(resetToken.Email, normalizedEmail) {
		return nil, ErrInvalidResetToken
	}

	if !resetToken.IsValid(time.Now()) {
		return nil, ErrInvalidResetToken
	}

	return resetToken, nil
}

func (s *PasswordService) logAudit(ctx context.Context, userID, email, action string, success bool, reason, ip, userAgent string) error {
	audit := entity.NewPasswordAuditLog(security.GenerateNewID(), userID, email, action, success, reason, ip, userAgent)
	return s.auditRepo.Create(ctx, audit)
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func generateResetCredentials() (token, code, tokenHash, codeHash string, err error) {
	tokenBytes := make([]byte, 32)
	if _, err = rand.Read(tokenBytes); err != nil {
		return "", "", "", "", err
	}
	token = base64.RawURLEncoding.EncodeToString(tokenBytes)
	tokenHash = hashToken(token)

	code, err = generateNumericCode(resetCodeLength)
	if err != nil {
		return "", "", "", "", err
	}
	codeHash = hashToken(code)
	return token, code, tokenHash, codeHash, nil
}

func generateNumericCode(length int) (string, error) {
	const digits = "0123456789"
	code := make([]byte, length)
	for i := range code {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(digits))))
		if err != nil {
			return "", err
		}
		code[i] = digits[num.Int64()]
	}
	return string(code), nil
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
