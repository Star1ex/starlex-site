package service

import (
	"context"
	"errors"
	"testing"
	"time"

	domainSession "github.com/Star1ex/starlex-site/internal/domain/session"
	"gorm.io/gorm"
)

type mockSessionRepo struct {
	sessions map[string]*domainSession.Session
	byHash   map[string]string
}

func newMockSessionRepo() *mockSessionRepo {
	return &mockSessionRepo{
		sessions: map[string]*domainSession.Session{},
		byHash:   map[string]string{},
	}
}

func (m *mockSessionRepo) Create(_ context.Context, s *domainSession.Session) error {
	cp := *s
	m.sessions[s.ID] = &cp
	m.byHash[s.RefreshTokenHash] = s.ID
	return nil
}

func (m *mockSessionRepo) FindByRefreshHash(_ context.Context, refreshHash string) (*domainSession.Session, error) {
	id, ok := m.byHash[refreshHash]
	if !ok {
		return nil, gorm.ErrRecordNotFound
	}
	sessionEntity := m.sessions[id]
	if !sessionEntity.IsActive(time.Now()) {
		return nil, gorm.ErrRecordNotFound
	}
	cp := *sessionEntity
	return &cp, nil
}

func (m *mockSessionRepo) FindByID(_ context.Context, id string) (*domainSession.Session, error) {
	sessionEntity, ok := m.sessions[id]
	if !ok {
		return nil, gorm.ErrRecordNotFound
	}
	cp := *sessionEntity
	return &cp, nil
}

func (m *mockSessionRepo) ListActiveByUser(_ context.Context, userID string) ([]*domainSession.Session, error) {
	out := []*domainSession.Session{}
	for _, sessionEntity := range m.sessions {
		if sessionEntity.UserID == userID && sessionEntity.IsActive(time.Now()) {
			cp := *sessionEntity
			out = append(out, &cp)
		}
	}
	return out, nil
}

func (m *mockSessionRepo) Revoke(_ context.Context, id string) error {
	sessionEntity, ok := m.sessions[id]
	if !ok {
		return gorm.ErrRecordNotFound
	}
	now := time.Now()
	sessionEntity.RevokedAt = &now
	return nil
}

func (m *mockSessionRepo) RevokeAllByUser(_ context.Context, userID string) error {
	for _, sessionEntity := range m.sessions {
		if sessionEntity.UserID == userID {
			now := time.Now()
			sessionEntity.RevokedAt = &now
		}
	}
	return nil
}

func (m *mockSessionRepo) TouchLastSeen(_ context.Context, id string) error {
	sessionEntity, ok := m.sessions[id]
	if !ok {
		return gorm.ErrRecordNotFound
	}
	sessionEntity.LastSeenAt = time.Now()
	return nil
}

func (m *mockSessionRepo) RotateRefreshHash(_ context.Context, id, refreshHash string, expiresAt time.Time) error {
	sessionEntity, ok := m.sessions[id]
	if !ok {
		return gorm.ErrRecordNotFound
	}
	delete(m.byHash, sessionEntity.RefreshTokenHash)
	sessionEntity.RefreshTokenHash = refreshHash
	sessionEntity.ExpiresAt = expiresAt
	sessionEntity.LastSeenAt = time.Now()
	m.byHash[refreshHash] = id
	return nil
}

func TestSessionServiceCreateHashesRefreshToken(t *testing.T) {
	repo := newMockSessionRepo()
	svc := NewSessionService(repo)

	sessionEntity, err := svc.Create(context.Background(), "user-1", "device-1", "ua", "ip", "refresh-token", time.Now().Add(time.Hour))
	if err != nil {
		t.Fatalf("create session: %v", err)
	}
	if sessionEntity.RefreshTokenHash == "refresh-token" {
		t.Fatal("refresh token must be stored as a hash")
	}
	if repo.sessions[sessionEntity.ID].RefreshTokenHash != svc.RefreshTokenHash("refresh-token") {
		t.Fatal("stored hash does not match refresh token")
	}
}

func TestSessionServiceFindByDeviceRefreshToken(t *testing.T) {
	tests := []struct {
		name      string
		deviceID  string
		token     string
		wantError error
	}{
		{name: "matching device", deviceID: "device-1", token: "refresh-token"},
		{name: "wrong device", deviceID: "device-2", token: "refresh-token", wantError: ErrSessionDeviceMismatch},
		{name: "unknown token", deviceID: "device-1", token: "missing", wantError: ErrSessionNotFound},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := newMockSessionRepo()
			svc := NewSessionService(repo)
			_, err := svc.Create(context.Background(), "user-1", "device-1", "ua", "ip", "refresh-token", time.Now().Add(time.Hour))
			if err != nil {
				t.Fatalf("seed session: %v", err)
			}

			_, err = svc.FindByDeviceRefreshToken(context.Background(), tt.deviceID, tt.token)
			if !errors.Is(err, tt.wantError) {
				t.Fatalf("want %v, got %v", tt.wantError, err)
			}
		})
	}
}

func TestSessionServiceRotateRefreshToken(t *testing.T) {
	repo := newMockSessionRepo()
	svc := NewSessionService(repo)
	sessionEntity, err := svc.Create(context.Background(), "user-1", "device-1", "ua", "ip", "old-token", time.Now().Add(time.Hour))
	if err != nil {
		t.Fatalf("seed session: %v", err)
	}

	if err := svc.RotateRefreshToken(context.Background(), sessionEntity.ID, "new-token", time.Now().Add(2*time.Hour)); err != nil {
		t.Fatalf("rotate refresh: %v", err)
	}
	if _, err := svc.FindByDeviceRefreshToken(context.Background(), "device-1", "old-token"); !errors.Is(err, ErrSessionNotFound) {
		t.Fatalf("old refresh token should be invalid, got %v", err)
	}
	if _, err := svc.FindByDeviceRefreshToken(context.Background(), "device-1", "new-token"); err != nil {
		t.Fatalf("new refresh token should be valid: %v", err)
	}
}

func TestSessionServiceRevokeMakesRefreshInvalid(t *testing.T) {
	repo := newMockSessionRepo()
	svc := NewSessionService(repo)
	sessionEntity, err := svc.Create(context.Background(), "user-1", "device-1", "ua", "ip", "refresh-token", time.Now().Add(time.Hour))
	if err != nil {
		t.Fatalf("seed session: %v", err)
	}

	if err := svc.Revoke(context.Background(), sessionEntity.ID); err != nil {
		t.Fatalf("revoke session: %v", err)
	}
	if _, err := svc.FindByDeviceRefreshToken(context.Background(), "device-1", "refresh-token"); !errors.Is(err, ErrSessionNotFound) {
		t.Fatalf("revoked refresh token should fail, got %v", err)
	}
}
