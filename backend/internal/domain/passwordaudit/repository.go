package passwordaudit

import (
	"context"
	"time"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
)

type Repository interface {
	Create(ctx context.Context, log *entity.PasswordAuditLog) error
	CountByEmailSince(ctx context.Context, email, action string, since time.Time) (int64, error)
}
