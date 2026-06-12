package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"time"

	domainSession "github.com/Star1ex/starlex-site/internal/domain/session"
	"github.com/Star1ex/starlex-site/internal/security"
)

var (
	ErrSessionNotFound       = errors.New("session not found")
	ErrSessionDeviceMismatch = errors.New("session device mismatch")
)

type SessionService struct {
	repo domainSession.Repository
}

func NewSessionService(repo domainSession.Repository) *SessionService {
	return &SessionService{repo: repo}
}

func (s *SessionService) Create(ctx context.Context, userID, deviceID, userAgent, ip, refreshToken string, expiresAt time.Time) (*domainSession.Session, error) {
	now := time.Now().UTC()
	sessionEntity := &domainSession.Session{
		ID:               security.GenerateNewID(),
		UserID:           userID,
		DeviceID:         deviceID,
		UserAgent:        userAgent,
		IP:               ip,
		RefreshTokenHash: s.RefreshTokenHash(refreshToken),
		CreatedAt:        now,
		LastSeenAt:       now,
		ExpiresAt:        expiresAt,
	}
	if err := s.repo.Create(ctx, sessionEntity); err != nil {
		return nil, err
	}
	return sessionEntity, nil
}

func (s *SessionService) FindByDeviceRefreshToken(ctx context.Context, deviceID, refreshToken string) (*domainSession.Session, error) {
	sessionEntity, err := s.repo.FindByRefreshHash(ctx, s.RefreshTokenHash(refreshToken))
	if err != nil {
		return nil, ErrSessionNotFound
	}
	if sessionEntity.DeviceID != deviceID {
		return nil, ErrSessionDeviceMismatch
	}
	return sessionEntity, nil
}

func (s *SessionService) ListActiveByUser(ctx context.Context, userID string) ([]*domainSession.Session, error) {
	return s.repo.ListActiveByUser(ctx, userID)
}

func (s *SessionService) FindByID(ctx context.Context, id string) (*domainSession.Session, error) {
	sessionEntity, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, ErrSessionNotFound
	}
	return sessionEntity, nil
}

func (s *SessionService) Revoke(ctx context.Context, id string) error {
	if err := s.repo.Revoke(ctx, id); err != nil {
		return ErrSessionNotFound
	}
	return nil
}

func (s *SessionService) RevokeAllByUser(ctx context.Context, userID string) error {
	return s.repo.RevokeAllByUser(ctx, userID)
}

func (s *SessionService) RotateRefreshToken(ctx context.Context, id, refreshToken string, expiresAt time.Time) error {
	if err := s.repo.RotateRefreshHash(ctx, id, s.RefreshTokenHash(refreshToken), expiresAt); err != nil {
		return ErrSessionNotFound
	}
	return nil
}

func (s *SessionService) RefreshTokenHash(refreshToken string) string {
	sum := sha256.Sum256([]byte(refreshToken))
	return hex.EncodeToString(sum[:])
}
