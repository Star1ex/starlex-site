package user

import (
	"context"
	"mime/multipart"

	"github.com/Star1ex/starlex-site/internal/api/dto"
	"github.com/Star1ex/starlex-site/internal/domain/entity"
)

type Service interface {

	// CRUD
	CreateUnverified(ctx context.Context, u *dto.UserApi) (string, error)
	Create(ctx context.Context, u *dto.UserApi) error
	CreateOAuth(ctx context.Context, u *entity.User) error
	Update(ctx context.Context, u *entity.User, id string) error
	Get(ctx context.Context, id string) (*entity.User, error)
	GetByEmail(ctx context.Context, email string) (*entity.User, error)
	GetByGoogleID(ctx context.Context, googleID string) (*entity.User, error)
	GetByGithubID(ctx context.Context, githubID string) (*entity.User, error)
	UpdateOAuthFields(ctx context.Context, userID string, update OAuthUpdate) error

	// Auth
	Login(ctx context.Context, email, password string) (*entity.User, error)
	RecordLogin(ctx context.Context, userID, ip string) error

	// Others
	GetWorkspaces(ctx context.Context, userID string) ([]*entity.Workspace, error)

	// Search users by email
	Search(ctx context.Context, email string) ([]*entity.User, error)

	UploadUserPhoto(ctx context.Context, username string, file *multipart.FileHeader) (string, error)

	SetUserPhoto(id, photo_url string) error

	GetPhoto(ctx context.Context, userID string) (string, error)

	PublishUserRegistered(user *entity.User)
	PublishUserLogin(user *entity.User)

	GetTokenVersion(ctx context.Context, userID string) (int, error)
	BustTokenVersionCache(userID string)
}
