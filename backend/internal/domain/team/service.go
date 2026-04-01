package team

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
)

type Service interface {

	// Create team
	CreateTeam(ctx context.Context, name, description, userID string) (*entity.Team, error)
	Delete(ctx context.Context, teamID, userID string) error
	UpdateTeamName(ctx context.Context, teamID, name, userID string) error
	UpdateTeamDescription(ctx context.Context, teamID, description, userID string) error
	UpdateTeamIcon(ctx context.Context, teamID, icon, userID string) error
	// Retrieves all users from team
	GetUsers(ctx context.Context, teamId string) ([]*entity.User, error)
	AddUserToTeam(ctx context.Context, teamID string, email string, requesterID string) error
	RemoveUserFromTeam(ctx context.Context, teamID, userIDToRemove, currentUserID string) error
	GetTeamByID(ctx context.Context, teamID string) (*entity.Team, error)
}
