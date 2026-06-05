package registration

import (
	"context"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
)

// Repository persists not-yet-verified sign-ups. One pending registration exists
// per email at a time (Upsert replaces any prior attempt).
type Repository interface {
	Upsert(ctx context.Context, p *entity.PendingRegistration) error
	GetByEmail(ctx context.Context, email string) (*entity.PendingRegistration, error)
	DeleteByEmail(ctx context.Context, email string) error
	IncrementAttempts(ctx context.Context, email string) error
}
