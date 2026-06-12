package handlers

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	"github.com/Star1ex/starlex-site/internal/domain/registration"
	domainSession "github.com/Star1ex/starlex-site/internal/domain/session"
	"github.com/Star1ex/starlex-site/internal/domain/user"
	"github.com/Star1ex/starlex-site/internal/events"
	"github.com/Star1ex/starlex-site/internal/logger"
	"github.com/Star1ex/starlex-site/internal/service"
	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

func init() {
	logger.Log = zap.NewNop().Sugar()
}

type fakeAuthUserService struct {
	user.Service
	loginUser  *entity.User
	workspaces []*entity.Workspace
}

func (f *fakeAuthUserService) Login(context.Context, string, string) (*entity.User, error) {
	return f.loginUser, nil
}

func (f *fakeAuthUserService) RecordLogin(context.Context, string, string) error {
	return nil
}

func (f *fakeAuthUserService) GetWorkspaces(context.Context, string) ([]*entity.Workspace, error) {
	return f.workspaces, nil
}

type fakeHandlerSessionService struct {
	domainSession.Service
	created []*domainSession.Session
}

func (f *fakeHandlerSessionService) Create(_ context.Context, userID, deviceID, userAgent, ip, refreshToken string, expiresAt time.Time) (*domainSession.Session, error) {
	sessionEntity := &domainSession.Session{
		ID:               "session-" + userID,
		UserID:           userID,
		DeviceID:         deviceID,
		UserAgent:        userAgent,
		IP:               ip,
		RefreshTokenHash: refreshToken,
		CreatedAt:        time.Now(),
		LastSeenAt:       time.Now(),
		ExpiresAt:        expiresAt,
	}
	f.created = append(f.created, sessionEntity)
	return sessionEntity, nil
}

type fakePendingRegistrationRepo struct {
	registration.Repository
	byEmail map[string]*entity.PendingRegistration
}

func (f *fakePendingRegistrationRepo) GetByEmail(_ context.Context, email string) (*entity.PendingRegistration, error) {
	pending, ok := f.byEmail[email]
	if !ok {
		return nil, errors.New("not found")
	}
	cp := *pending
	return &cp, nil
}

func (f *fakePendingRegistrationRepo) DeleteByEmail(_ context.Context, email string) error {
	delete(f.byEmail, email)
	return nil
}

func (f *fakePendingRegistrationRepo) IncrementAttempts(_ context.Context, email string) error {
	if pending, ok := f.byEmail[email]; ok {
		pending.Attempts++
	}
	return nil
}

func (f *fakePendingRegistrationRepo) Upsert(_ context.Context, p *entity.PendingRegistration) error {
	cp := *p
	f.byEmail[p.Email] = &cp
	return nil
}

type fakeRegistrationUserRepo struct {
	user.Repository
	created []*entity.User
}

func (f *fakeRegistrationUserRepo) Create(_ context.Context, userEntity *entity.User) error {
	f.created = append(f.created, userEntity)
	return nil
}

func TestLoginCreatesDeviceBoundSessionAndNeedsOnboarding(t *testing.T) {
	sessionService := &fakeHandlerSessionService{}
	h := &Handlers{
		userService: &fakeAuthUserService{loginUser: &entity.User{
			ID:           "user-1",
			Email:        "jane@example.com",
			TokenVersion: 1,
			IsVerified:   true,
		}},
		sessionService:  sessionService,
		jwtSecret:       strings.Repeat("x", 32),
		frontendBaseURL: "https://app.example.com",
	}

	body := bytes.NewBufferString(`{"email":"jane@example.com","password":"password"}`)
	req, err := http.NewRequest(http.MethodPost, "/login", body)
	if err != nil {
		t.Fatalf("request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "Mozilla/5.0 Chrome/120 Linux")

	app := fiber.New()
	app.Post("/login", h.Login)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("login request: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("want 200, got %d", resp.StatusCode)
	}

	var payload map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["needs_onboarding"] != true {
		t.Fatalf("login should return needs_onboarding=true, got %v", payload["needs_onboarding"])
	}
	if len(sessionService.created) != 1 {
		t.Fatalf("login should create one session, got %d", len(sessionService.created))
	}
	if sessionService.created[0].DeviceID == "" {
		t.Fatal("session should be bound to a device id")
	}
}

func TestVerifyEmailReturnsNeedsOnboardingAndCreatesSession(t *testing.T) {
	pendingRepo := &fakePendingRegistrationRepo{byEmail: map[string]*entity.PendingRegistration{
		"jane@example.com": entity.NewPendingRegistration("pending-1", "jane@example.com", "hashed", "Jane", "Doe", testHashToken("123456"), "1.2.3.4", 15*time.Minute),
	}}
	userRepo := &fakeRegistrationUserRepo{}
	registrationService := service.NewRegistrationService(pendingRepo, userRepo, nil, events.NewBus())
	sessionService := &fakeHandlerSessionService{}
	h := &Handlers{
		registrationService: registrationService,
		sessionService:      sessionService,
		jwtSecret:           strings.Repeat("x", 32),
		frontendBaseURL:     "https://app.example.com",
	}

	body := bytes.NewBufferString(`{"email":"jane@example.com","code":"123456"}`)
	req, err := http.NewRequest(http.MethodPost, "/verify", body)
	if err != nil {
		t.Fatalf("request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "Mozilla/5.0 Safari/605 Mac OS X")

	app := fiber.New()
	app.Post("/verify", h.VerifyEmail)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("verify request: %v", err)
	}
	if resp.StatusCode != fiber.StatusOK {
		t.Fatalf("want 200, got %d", resp.StatusCode)
	}

	var payload map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if payload["needs_onboarding"] != true {
		t.Fatalf("verify should return needs_onboarding=true, got %v", payload["needs_onboarding"])
	}
	if payload["access_token"] == "" {
		t.Fatal("verify should return an access token")
	}
	if len(userRepo.created) != 1 || !userRepo.created[0].IsVerified {
		t.Fatalf("verify should create one verified user, got %#v", userRepo.created)
	}
	if len(sessionService.created) != 1 {
		t.Fatalf("verify should create one session, got %d", len(sessionService.created))
	}
}

func testHashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
