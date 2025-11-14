package user

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
)

type Repository interface {

	// CRUD
	Create(ctx context.Context, u *entity.User) error
	Delete(ctx context.Context, id string) error

	// Get user by email
	GetByEmail(ctx context.Context, email string) (*entity.User, error)
	GetUserTeams(ctx context.Context, userID string) ([]*entity.Team, error)
}
