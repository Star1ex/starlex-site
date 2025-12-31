package service

import (
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"time"

	"github.com/Team-Tracks/team-track-site/internal/api/dto"
	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"github.com/Team-Tracks/team-track-site/internal/domain/user"
	"github.com/Team-Tracks/team-track-site/internal/events"
	"github.com/Team-Tracks/team-track-site/internal/security"
	"github.com/Team-Tracks/team-track-site/internal/storage"
)

type UserService struct {
	repo    user.Repository
	storage storage.Storage
	bus     *events.Bus
}

func NewUserService(repo user.Repository, storage storage.Storage, bus *events.Bus) *UserService {
	return &UserService{
		repo: repo, storage: storage, bus: bus,
	}
}

func (s *UserService) CreateUnverified(ctx context.Context, u *dto.UserApi) (string, error) {
	id := security.GenerateNewID()
	hashedPassword, err := security.HashPassword(u.Password)
	if err != nil {
		return "", err
	}
	newUser := entity.NewUser(id, u.Email, hashedPassword, u.FirstName, u.LastName)
	// User is created as unverified (IsVerified = false by default)

	if err := s.repo.Create(ctx, newUser); err != nil {
		return "", err
	}

	s.PublishUserRegistered(newUser)

	return newUser.ID, nil
}

// Old Create method - keep for backward compatibility if needed, or remove
func (s *UserService) Create(ctx context.Context, u *dto.UserApi) error {
	_, err := s.CreateUnverified(ctx, u)
	return err
}

func (s *UserService) Get(ctx context.Context, id string) (*entity.User, error) {
	return s.repo.Get(ctx, id)
}

func (s *UserService) Login(ctx context.Context, email, password string) (*entity.User, error) {
	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	ok, err := security.VerifyPassword(user.Password, password)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, errors.New("invalid password")
	}

	return user, nil
}

func (s *UserService) GetTeams(ctx context.Context, userID string) ([]*entity.Team, error) {
	teams, err := s.repo.GetUserTeams(ctx, userID)
	if err != nil {
		return nil, err
	}
	return teams, nil
}

func (s *UserService) Search(ctx context.Context, email string) ([]*entity.User, error) {
	return s.repo.Search(ctx, email)
}

func (s *UserService) SetUserPhoto(id, photo_url string) error {
	return s.repo.UpdatePhoto(id, photo_url)
}

func (s *UserService) UploadUserPhoto(ctx context.Context, username string, file *multipart.FileHeader) (string, error) {
	path := fmt.Sprintf("avatars/%s/%s", username, file.Filename)

	url, err := s.storage.UploadFile(ctx, file, path)
	if err != nil {
		return "", err
	}

	if err := s.repo.UpdatePhoto(username, url); err != nil {
		return "", err
	}

	return url, nil
}

func (s *UserService) GetPhoto(ctx context.Context, userID string) (string, error) {
	return s.repo.GetPhoto(ctx, userID)
}

func (s *UserService) Update(ctx context.Context, u *entity.User, id string) error {
	return s.repo.Update(ctx, u, id)
}

func (s *UserService) PublishUserRegistered(user *entity.User) {
	s.bus.Publish(events.UserRegisteredEvent{
		UserID:     user.ID,
		Email:      user.Email,
		FirstName:  user.FirstName,
		LastName:   user.LastName,
		OccurredAt: time.Now(),
	})
}
