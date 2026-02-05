package user

import (
	"context"
	"mime/multipart"

	"github.com/Team-Tracks/team-track-site/internal/api/dto"
	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
)

type Service interface {

	// CRUD
	CreateUnverified(ctx context.Context, u *dto.UserApi) (string, error)
	Create(ctx context.Context, u *dto.UserApi) error
	Update(ctx context.Context, u *entity.User, id string) error
	Get(ctx context.Context, id string) (*entity.User, error)
	GetByEmail(ctx context.Context, email string) (*entity.User, error)
	GetByGoogleID(ctx context.Context, googleID string) (*entity.User, error)
	GetByGithubID(ctx context.Context, githubID string) (*entity.User, error)
	UpdateOAuthFields(ctx context.Context, userID string, update OAuthUpdate) error

	// Auth
	Login(ctx context.Context, email, password string) (*entity.User, error)

	// Others
	GetTeams(ctx context.Context, userID string) ([]*entity.Team, error)

	// Search users by email
	Search(ctx context.Context, email string) ([]*entity.User, error)

	UploadUserPhoto(ctx context.Context, username string, file *multipart.FileHeader) (string, error)

	SetUserPhoto(id, photo_url string) error

	GetPhoto(ctx context.Context, userID string) (string, error)

	PublishUserRegistered(user *entity.User)

	GetTokenVersion(ctx context.Context, userID string) (int, error)
}
