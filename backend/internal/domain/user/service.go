package user

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
)

type Service interface {

	// CRUD
	Create(ctx context.Context, u *entity.User) error

	// GetByEmail
	Login(ctx context.Context, email, password string) (*entity.User, error)
	GetTeams(ctx context.Context, userID string)([]*entity.Team, error)
}
