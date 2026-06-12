package session

import (
	"context"
	"time"
)

type Service interface {
	Create(ctx context.Context, userID, deviceID, userAgent, ip, refreshToken string, expiresAt time.Time) (*Session, error)
	FindByDeviceRefreshToken(ctx context.Context, deviceID, refreshToken string) (*Session, error)
	ListActiveByUser(ctx context.Context, userID string) ([]*Session, error)
	FindByID(ctx context.Context, id string) (*Session, error)
	Revoke(ctx context.Context, id string) error
	RevokeAllByUser(ctx context.Context, userID string) error
	RotateRefreshToken(ctx context.Context, id, refreshToken string, expiresAt time.Time) error
	RefreshTokenHash(refreshToken string) string
}
