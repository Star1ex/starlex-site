package passwordreset

import (
	"context"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
)

type Repository interface {
	Create(ctx context.Context, token *entity.PasswordResetToken) error
	GetByTokenHash(ctx context.Context, tokenHash string) (*entity.PasswordResetToken, error)
	GetByCodeHash(ctx context.Context, email, codeHash string) (*entity.PasswordResetToken, error)
	MarkAsUsed(ctx context.Context, id string) error
	DeleteExpired(ctx context.Context, nowUnix int64) (int64, error)
}
