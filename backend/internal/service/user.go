package service

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/domain/user"
	"github.com/Team-Tracks/team-track-site/security"
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
	id:=security.GenerateNewID()
	hashedPassword,err:=security.HashPassword(u.Password)
	if err != nil{
		return err
	}
	newUser:=user.NewUser(id,u.Email,hashedPassword,u.FirstName,u.LastName)
	if err := s.repo.Create(ctx, newUser); err != nil {
		return err
	}
	
	return nil
}

func (s *UserService) Login(ctx context.Context, email,password string) (*user.User, error) {
	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	err=security.ComparePassword(user.Password,password)
	if err!=nil{
		return nil,err
	}
	return user, nil
}
