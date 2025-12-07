package service

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"github.com/Team-Tracks/team-track-site/internal/domain/team"
	"github.com/Team-Tracks/team-track-site/internal/domain/user"
	"github.com/Team-Tracks/team-track-site/internal/security"
)

type TeamService struct {
	repo     team.Repository
	userRepo user.Repository
}

func NewTeamService(repo team.Repository, userRepo user.Repository) *TeamService {
	return &TeamService{repo: repo, userRepo: userRepo}
}

func (s *TeamService) CreateTeam(ctx context.Context, name, description, userID string) (*entity.Team, error) {
	newId := security.GenerateNewID()

	newTeam := &entity.Team{
		ID:          newId,
		Name:        name,
		Description: description,
		OwnerID:     userID,
	}

	err := s.repo.CreateAndAddCreator(ctx, newTeam, userID)
	if err != nil {
		return nil, err
	}

	return newTeam, nil
}

func (s *TeamService) GetUsers(ctx context.Context, teamId string) ([]*entity.User, error) {
	users, err := s.repo.GetTeam(ctx, teamId)
	if err != nil {
		return nil, err
	}
	return users, nil
}
