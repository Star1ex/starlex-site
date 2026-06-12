package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	"github.com/Star1ex/starlex-site/internal/domain/user"
	"github.com/Star1ex/starlex-site/internal/events"
)

// --- mocks ---

type mockPendingRepo struct {
	byEmail map[string]*entity.PendingRegistration
}

func (m *mockPendingRepo) Upsert(_ context.Context, p *entity.PendingRegistration) error {
	cp := *p
	m.byEmail[p.Email] = &cp
	return nil
}

func (m *mockPendingRepo) GetByEmail(_ context.Context, email string) (*entity.PendingRegistration, error) {
	p, ok := m.byEmail[email]
	if !ok {
		return nil, errors.New("not found")
	}
	cp := *p
	return &cp, nil
}

func (m *mockPendingRepo) DeleteByEmail(_ context.Context, email string) error {
	delete(m.byEmail, email)
	return nil
}

func (m *mockPendingRepo) IncrementAttempts(_ context.Context, email string) error {
	if p, ok := m.byEmail[email]; ok {
		p.Attempts++
	}
	return nil
}

type mockRegUserRepo struct {
	user.Repository
	created map[string]*entity.User
}

func (m *mockRegUserRepo) Create(_ context.Context, u *entity.User) error {
	m.created[u.Email] = u
	return nil
}

func newRegService() (*RegistrationService, *mockPendingRepo, *mockRegUserRepo) {
	pr := &mockPendingRepo{byEmail: map[string]*entity.PendingRegistration{}}
	ur := &mockRegUserRepo{created: map[string]*entity.User{}}
	// emailService is nil: Confirm/the validation paths under test never send mail.
	return NewRegistrationService(pr, ur, nil, events.NewBus()), pr, ur
}

// --- tests ---

func seedPending(pr *mockPendingRepo, email, code string, ttl time.Duration) {
	pr.byEmail[email] = entity.NewPendingRegistration(
		"pid", email, "hashed-pw", "Jane", "Doe", hashToken(code), "1.2.3.4", ttl,
	)
}

func TestSeedPendingStoresCodeHash(t *testing.T) {
	pr := &mockPendingRepo{byEmail: map[string]*entity.PendingRegistration{}}
	seedPending(pr, "jane@x.io", "123456", 15*time.Minute)

	if pr.byEmail["jane@x.io"].CodeHash == "123456" {
		t.Fatal("pending registration must not store plaintext verification code")
	}
	if !registrationCodeMatches(pr.byEmail["jane@x.io"].CodeHash, "123456") {
		t.Fatal("stored code hash should verify the original code")
	}
}

// The user must only be created (persisted) after a correct code is supplied.
func TestConfirm_CreatesVerifiedUser(t *testing.T) {
	svc, pr, ur := newRegService()
	seedPending(pr, "jane@x.io", "123456", 15*time.Minute)

	u, err := svc.Confirm(context.Background(), "jane@x.io", "123456", "9.9.9.9")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if u == nil || !u.IsVerified {
		t.Fatalf("confirmed user must be verified, got %+v", u)
	}
	if u.Email != "jane@x.io" || u.Password != "hashed-pw" {
		t.Errorf("user not built from pending record: %+v", u)
	}
	if u.SignupIP == nil || *u.SignupIP != "1.2.3.4" {
		t.Errorf("signup IP should carry over from pending: %v", u.SignupIP)
	}
	if _, ok := ur.created["jane@x.io"]; !ok {
		t.Error("user should have been persisted")
	}
	if _, ok := pr.byEmail["jane@x.io"]; ok {
		t.Error("pending registration should be deleted after confirmation")
	}
}

func TestConfirm_WrongCode_NoUserCreated(t *testing.T) {
	svc, pr, ur := newRegService()
	seedPending(pr, "jane@x.io", "123456", 15*time.Minute)

	_, err := svc.Confirm(context.Background(), "jane@x.io", "000000", "9.9.9.9")
	if !errors.Is(err, ErrInvalidCode) {
		t.Fatalf("want ErrInvalidCode, got %v", err)
	}
	if len(ur.created) != 0 {
		t.Error("no user must be created on wrong code")
	}
	if pr.byEmail["jane@x.io"].Attempts != 1 {
		t.Errorf("attempts should increment, got %d", pr.byEmail["jane@x.io"].Attempts)
	}
	var invalidCode InvalidCodeError
	if !errors.As(err, &invalidCode) {
		t.Fatalf("wrong code should include remaining attempts, got %v", err)
	}
	if invalidCode.RemainingAttempts != maxVerifyAttempts-1 {
		t.Fatalf("want %d remaining attempts, got %d", maxVerifyAttempts-1, invalidCode.RemainingAttempts)
	}
}

func TestConfirm_Expired(t *testing.T) {
	svc, pr, _ := newRegService()
	seedPending(pr, "jane@x.io", "123456", -1*time.Minute) // already expired

	_, err := svc.Confirm(context.Background(), "jane@x.io", "123456", "9.9.9.9")
	if !errors.Is(err, ErrCodeExpired) {
		t.Fatalf("want ErrCodeExpired, got %v", err)
	}
	if _, ok := pr.byEmail["jane@x.io"]; ok {
		t.Error("expired pending registration should be deleted")
	}
}

func TestConfirm_NoPending(t *testing.T) {
	svc, _, _ := newRegService()
	_, err := svc.Confirm(context.Background(), "ghost@x.io", "123456", "9.9.9.9")
	if !errors.Is(err, ErrPendingNotFound) {
		t.Fatalf("want ErrPendingNotFound, got %v", err)
	}
}

func TestConfirm_TooManyAttempts(t *testing.T) {
	svc, pr, _ := newRegService()
	seedPending(pr, "jane@x.io", "123456", 15*time.Minute)
	pr.byEmail["jane@x.io"].Attempts = maxVerifyAttempts - 1

	_, err := svc.Confirm(context.Background(), "jane@x.io", "999999", "9.9.9.9")
	if !errors.Is(err, ErrTooManyAttempts) {
		t.Fatalf("want ErrTooManyAttempts, got %v", err)
	}
	if _, ok := pr.byEmail["jane@x.io"]; ok {
		t.Error("pending registration should be discarded after too many attempts")
	}
}

func TestResend_EnforcesCooldown(t *testing.T) {
	svc, pr, _ := newRegService()
	seedPending(pr, "jane@x.io", "123456", 15*time.Minute)

	err := svc.Resend(context.Background(), "jane@x.io")
	if !errors.Is(err, ErrResendCooldown) {
		t.Fatalf("want ErrResendCooldown, got %v", err)
	}
	var cooldown ResendCooldownError
	if !errors.As(err, &cooldown) {
		t.Fatalf("want ResendCooldownError details, got %v", err)
	}
	if cooldown.RetryAfter <= 0 {
		t.Fatalf("retry_after should be positive, got %s", cooldown.RetryAfter)
	}
}
