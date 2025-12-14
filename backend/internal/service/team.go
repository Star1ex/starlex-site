package service

import (
	"context"
	"errors"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"github.com/Team-Tracks/team-track-site/internal/domain/team"
	"github.com/Team-Tracks/team-track-site/internal/domain/user"
	"github.com/Team-Tracks/team-track-site/internal/security"
)

type TeamService struct {
	teamRepo team.Repository
	userRepo user.Repository
}

func NewTeamService(teamRepo team.Repository, userRepo user.Repository) *TeamService {
	return &TeamService{teamRepo: teamRepo, userRepo: userRepo}
}

func (s *TeamService) CreateTeam(ctx context.Context, name, description, userID string) (*entity.Team, error) {
	newId := security.GenerateNewID()

	newTeam := &entity.Team{
		ID:          newId,
		Name:        name,
		Description: description,
		OwnerID:     userID,
	}

	err := s.teamRepo.CreateAndAddCreator(ctx, newTeam, userID)
	if err != nil {
		return nil, err
	}

	return newTeam, nil
}

func (s *TeamService) GetUsers(ctx context.Context, teamId string) ([]*entity.User, error) {
	users, err := s.teamRepo.GetTeam(ctx, teamId)
	if err != nil {
		return nil, err
	}
	return users, nil
}

func (s *TeamService) AddUserToTeam(ctx context.Context, teamID string, email string, requesterID string) error {

	team, err := s.teamRepo.GetTeamByID(ctx, teamID)
	if err != nil {
		return err
	}

	if team.OwnerID != requesterID {
		return errors.New("only team owner can add users")
	}

	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return err
	}

	return s.teamRepo.AddUserToTeam(ctx, teamID, user.ID)
}

func (s *TeamService) RemoveUserFromTeam(ctx context.Context, teamID string, userID string) error {
	return s.teamRepo.RemoveUserFromTeam(ctx, teamID, userID)
}
