package service

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/domain/user"
)

type UserService struct {
	repo user.Repository
}

func NewUserService(repo user.Repository) *UserService {
	return &UserService{
		repo: repo,
	}
}

func (s *UserService) Create(ctx context.Context, u *user.User) error {
	if err := s.repo.Create(ctx, u); err != nil {
		return err
	}

	return nil
}

func (s *UserService) GetByEmail(ctx context.Context, email string) (*user.User, error) {
	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	return user, nil
}
