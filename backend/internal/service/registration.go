package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	"github.com/Star1ex/starlex-site/internal/domain/registration"
	"github.com/Star1ex/starlex-site/internal/domain/user"
	"github.com/Star1ex/starlex-site/internal/events"
	email "github.com/Star1ex/starlex-site/internal/infra/email"
	"github.com/Star1ex/starlex-site/internal/security"
)

const (
	registrationCodeTTL = 15 * time.Minute
	maxVerifyAttempts   = 5
)

var (
	// ErrPendingNotFound: no in-flight sign-up for this email.
	ErrPendingNotFound = errors.New("no pending registration for this email")
	// ErrCodeExpired: the verification window elapsed.
	ErrCodeExpired = errors.New("verification code expired")
	// ErrInvalidCode: wrong code supplied.
	ErrInvalidCode = errors.New("invalid verification code")
	// ErrTooManyAttempts: too many wrong codes; the sign-up was discarded.
	ErrTooManyAttempts = errors.New("too many attempts, please register again")
)

// RegistrationService implements verify-before-persist sign-up: the account is
// only written to the users table after the email is confirmed.
type RegistrationService struct {
	pendingRepo  registration.Repository
	userRepo     user.Repository
	emailService *email.EmailService
	bus          *events.Bus
}

func NewRegistrationService(
	pendingRepo registration.Repository,
	userRepo user.Repository,
	emailService *email.EmailService,
	bus *events.Bus,
) *RegistrationService {
	return &RegistrationService{
		pendingRepo:  pendingRepo,
		userRepo:     userRepo,
		emailService: emailService,
		bus:          bus,
	}
}

// Start records a pending registration (hashed password, names, fresh code) and
// emails the code. It does NOT create a user. Caller must first ensure the email
// is not already an existing account.
func (s *RegistrationService) Start(ctx context.Context, email, password, firstName, lastName, signupIP string) error {
	hashed, err := security.HashPassword(password)
	if err != nil {
		return err
	}
	code, err := generateNumericCode(6)
	if err != nil {
		return err
	}

	pending := entity.NewPendingRegistration(
		security.GenerateNewID(), email, hashed, firstName, lastName, code, signupIP, registrationCodeTTL,
	)
	if err := s.pendingRepo.Upsert(ctx, pending); err != nil {
		return err
	}

	if err := s.emailService.SendRegistrationCode(email, firstName, code); err != nil {
		return fmt.Errorf("failed to send verification email: %w", err)
	}
	return nil
}

// Confirm validates the code for a pending registration and, on success, creates
// the real verified user and removes the pending record.
func (s *RegistrationService) Confirm(ctx context.Context, email, code, ip string) (*entity.User, error) {
	pending, err := s.pendingRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, ErrPendingNotFound
	}

	if pending.IsExpired() {
		_ = s.pendingRepo.DeleteByEmail(ctx, email)
		return nil, ErrCodeExpired
	}

	if pending.Code != code {
		_ = s.pendingRepo.IncrementAttempts(ctx, email)
		if pending.Attempts+1 >= maxVerifyAttempts {
			_ = s.pendingRepo.DeleteByEmail(ctx, email)
			return nil, ErrTooManyAttempts
		}
		return nil, ErrInvalidCode
	}

	newUser := entity.NewUser(security.GenerateNewID(), pending.Email, pending.PasswordHash, pending.FirstName, pending.LastName)
	newUser.IsVerified = true
	if pending.SignupIP != "" {
		ip := pending.SignupIP
		newUser.SignupIP = &ip
	}

	if err := s.userRepo.Create(ctx, newUser); err != nil {
		return nil, err
	}

	_ = s.pendingRepo.DeleteByEmail(ctx, email)

	s.bus.Publish(events.UserRegisteredEvent{
		UserID:     newUser.ID,
		Email:      newUser.Email,
		FirstName:  newUser.FirstName,
		LastName:   newUser.LastName,
		OccurredAt: time.Now(),
	})

	return newUser, nil
}

// Resend issues a new code for an existing pending registration and re-sends it.
func (s *RegistrationService) Resend(ctx context.Context, email string) error {
	pending, err := s.pendingRepo.GetByEmail(ctx, email)
	if err != nil {
		return ErrPendingNotFound
	}

	code, err := generateNumericCode(6)
	if err != nil {
		return err
	}
	pending.Code = code
	pending.ExpiresAt = time.Now().Add(registrationCodeTTL)
	pending.Attempts = 0
	if err := s.pendingRepo.Upsert(ctx, pending); err != nil {
		return err
	}

	if err := s.emailService.SendRegistrationCode(email, pending.FirstName, code); err != nil {
		return fmt.Errorf("failed to send verification email: %w", err)
	}
	return nil
}
