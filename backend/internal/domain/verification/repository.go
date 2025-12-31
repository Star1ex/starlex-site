package verification

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
)

// interfaces for Verification Code
type Repository interface {
	Create(ctx context.Context, code *entity.VerificationCode) error
	GetByUserID(ctx context.Context, userID string) (*entity.VerificationCode, error)
	GetByCode(ctx context.Context, code string) (*entity.VerificationCode, error)
	MarkAsUsed(ctx context.Context, id string) error
	DeleteByUserID(ctx context.Context, userID string) error
}
