package session

import (
	"context"
	"time"
)

type Repository interface {
	Create(ctx context.Context, s *Session) error
	FindByRefreshHash(ctx context.Context, refreshHash string) (*Session, error)
	FindByID(ctx context.Context, id string) (*Session, error)
	ListActiveByUser(ctx context.Context, userID string) ([]*Session, error)
	Revoke(ctx context.Context, id string) error
	RevokeAllByUser(ctx context.Context, userID string) error
	TouchLastSeen(ctx context.Context, id string) error
	RotateRefreshHash(ctx context.Context, id, refreshHash string, expiresAt time.Time) error
}
