package service

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"github.com/Team-Tracks/team-track-site/internal/domain/user"
	"github.com/Team-Tracks/team-track-site/internal/domain/verification"
	email "github.com/Team-Tracks/team-track-site/internal/infra/email"
	"github.com/Team-Tracks/team-track-site/internal/security"
)

type VerificationService struct {
	verificationRepo verification.Repository
	userRepo         user.Repository
	emailService     *email.EmailService
}

func NewVerificationService(
	verificationRepo verification.Repository,
	userRepo user.Repository,
	emailService *email.EmailService,
) *VerificationService {
	return &VerificationService{
		verificationRepo: verificationRepo,
		userRepo:         userRepo,
		emailService:     emailService,
	}
}

func (s *VerificationService) GenerateAndSendCode(ctx context.Context, userID, email, firstName string) error {

	_ = s.verificationRepo.DeleteByUserID(ctx, userID)

	code, err := s.generateCode()
	if err != nil {
		return err
	}

	id := security.GenerateNewID()
	verificationCode := entity.NewVerificationCode(id, userID, code)

	if err := s.verificationRepo.Create(ctx, verificationCode); err != nil {
		return err
	}

	if err := s.emailService.SendVerificationCode(email, firstName, code); err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

func (s *VerificationService) VerifyCode(ctx context.Context, userID, code string) error {

	verificationCode, err := s.verificationRepo.GetByUserID(ctx, userID)
	if err != nil {
		return errors.New("verification code not found or already use")
	}

	if verificationCode.Code != code {
		return errors.New("invalid verification code")
	}

	if !verificationCode.IsValid() {
		return errors.New("verification code has expired or already been used")
	}

	if err := s.verificationRepo.MarkAsUsed(ctx, verificationCode.ID); err != nil {
		return err
	}

	if err := s.userRepo.MarkIsVerified(ctx, userID); err != nil {
		return err
	}

	return nil
}

func (s *VerificationService) generateCode() (string, error) {
	const digits = "0123456789"
	code := make([]byte, 6)

	for i := range code {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(digits))))
		if err != nil {
			return "", err
		}
		code[i] = digits[num.Int64()]
	}

	return string(code), nil
}
