package service

import (
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"sync"
	"time"

	"github.com/Star1ex/starlex-site/internal/api/dto"
	"github.com/Star1ex/starlex-site/internal/domain/entity"
	"github.com/Star1ex/starlex-site/internal/domain/user"
	"github.com/Star1ex/starlex-site/internal/events"
	"github.com/Star1ex/starlex-site/internal/security"
	"github.com/Star1ex/starlex-site/internal/storage"
)

type UserService struct {
	repo    user.Repository
	storage storage.Storage
	bus     *events.Bus
}

var ErrPasswordNotSet = errors.New("password not set")

type tokenVersionCache struct {
	mu      sync.RWMutex
	entries map[string]tokenVersionEntry
}

type tokenVersionEntry struct {
	version   int
	expiresAt time.Time
}

var tvCache = &tokenVersionCache{entries: make(map[string]tokenVersionEntry)}

func (c *tokenVersionCache) get(userID string) (int, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	entry, ok := c.entries[userID]
	if !ok || time.Now().After(entry.expiresAt) {
		return 0, false
	}
	return entry.version, true
}

func (c *tokenVersionCache) set(userID string, version int) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.entries[userID] = tokenVersionEntry{
		version:   version,
		expiresAt: time.Now().Add(60 * time.Second),
	}
}

func (c *tokenVersionCache) bust(userID string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	delete(c.entries, userID)
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

func (s *UserService) CreateOAuth(ctx context.Context, u *entity.User) error {
	if u == nil {
		return errors.New("missing user")
	}
	return s.repo.Create(ctx, u)
}

func (s *UserService) Get(ctx context.Context, id string) (*entity.User, error) {
	return s.repo.Get(ctx, id)
}

func (s *UserService) GetByEmail(ctx context.Context, email string) (*entity.User, error) {
	return s.repo.GetByEmail(ctx, email)
}

func (s *UserService) GetByGoogleID(ctx context.Context, googleID string) (*entity.User, error) {
	return s.repo.GetByGoogleID(ctx, googleID)
}

func (s *UserService) GetByGithubID(ctx context.Context, githubID string) (*entity.User, error) {
	return s.repo.GetByGithubID(ctx, githubID)
}

func (s *UserService) UpdateOAuthFields(ctx context.Context, userID string, update user.OAuthUpdate) error {
	return s.repo.UpdateOAuthFields(ctx, userID, update)
}

func (s *UserService) Login(ctx context.Context, email, password string) (*entity.User, error) {
	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	if user.Password == "" {
		return user, ErrPasswordNotSet
	}

	ok, err := security.VerifyPassword(user.Password, password)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, errors.New("invalid password")
	}

	s.PublishUserLogin(user)

	return user, nil
}

func (s *UserService) GetWorkspaces(ctx context.Context, userID string) ([]*entity.Workspace, error) {
	workspaces, err := s.repo.GetUserWorkspaces(ctx, userID)
	if err != nil {
		return nil, err
	}
	return workspaces, nil
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
	if u.FirstName != "" || u.LastName != "" {
		u.NameOverridden = true
	}
	return s.repo.Update(ctx, u, id)
}

// RecordLogin stores the most recent login time and source IP for the user.
// Failures are non-fatal to the login flow and handled by the caller.
func (s *UserService) RecordLogin(ctx context.Context, userID, ip string) error {
	return s.repo.MarkLastLogin(ctx, userID, ip)
}

func (s *UserService) GetTokenVersion(ctx context.Context, userID string) (int, error) {
	if v, ok := tvCache.get(userID); ok {
		return v, nil
	}
	version, err := s.repo.GetTokenVersion(ctx, userID)
	if err != nil {
		return 0, err
	}
	tvCache.set(userID, version)
	return version, nil
}

func (s *UserService) BustTokenVersionCache(userID string) {
	tvCache.bust(userID)
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

func (s *UserService) PublishUserLogin(user *entity.User) {
	s.bus.Publish(events.UserLoginEvent{
		UserID:     user.ID,
		Email:      user.Email,
		FirstName:  user.FirstName,
		LastName:   user.LastName,
		OccurredAt: time.Now(),
	})
}
