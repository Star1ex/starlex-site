package user

import (
	"context"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
)

type Repository interface {

	// CRUD
	Create(ctx context.Context, u *entity.User) error
	Get(ctx context.Context, id string) (*entity.User, error)
	Update(ctx context.Context, u *entity.User, id string) error
	Delete(ctx context.Context, id string) error

	// Get user by email
	GetByEmail(ctx context.Context, email string) (*entity.User, error)
	GetByGoogleID(ctx context.Context, googleID string) (*entity.User, error)
	GetByGithubID(ctx context.Context, githubID string) (*entity.User, error)
	GetUserWorkspaces(ctx context.Context, userID string) ([]*entity.Workspace, error)
	GetByIDs(ctx context.Context, ids []string) ([]*entity.User, error)

	// Search by email
	Search(ctx context.Context, email string) ([]*entity.User, error)

	// UpdatePhoto
	UpdatePhoto(username, photo_url string) error

	// GetPhoto
	GetPhoto(ctx context.Context, userID string) (string, error)

	// verify
	MarkIsVerified(ctx context.Context, userID string) error
	IsVerified(ctx context.Context, userID string) (bool, error)

	// login metadata
	MarkLastLogin(ctx context.Context, userID, ip string) error

	// password/session
	UpdatePasswordAndTokenVersion(ctx context.Context, userID, hashedPassword string, tokenVersion int) error
	GetTokenVersion(ctx context.Context, userID string) (int, error)

	// oauth updates
	UpdateOAuthFields(ctx context.Context, userID string, update OAuthUpdate) error
}
