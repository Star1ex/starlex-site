package team

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
)

// Intarfaces for repository Team
// Have full CRUD operations

type Repository interface {
	// CRUD
	CreateAndAddCreator(ctx context.Context, team *entity.Team, email string) error
	GetTeam(ctx context.Context, teamID string) ([]*entity.User, error)
	GetTeamByID(ctx context.Context, teamID string) (*entity.Team, error)
	AddUserToTeam(ctx context.Context, teamID string, userID string) error
	RemoveUserFromTeam(ctx context.Context, teamID string, userID string) error
	UpdateName(ctx context.Context, teamID string, name string) error
	UpdateDescription(ctx context.Context, teamID string, description string) error
	Delete(ctx context.Context, teamID string) error
}
