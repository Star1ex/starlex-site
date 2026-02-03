package folder

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
)

type Service interface {
	Create(ctx context.Context, folder *entity.Folder) error

	GetByID(ctx context.Context, id string) (*entity.Folder, error)
	GetUserFolders(ctx context.Context, userID string) ([]*entity.Folder, error)
	GetTeamFolders(ctx context.Context, teamID string) ([]*entity.Folder, error)
	GetSubFolders(ctx context.Context, parentID string) ([]*entity.Folder, error)

	Update(ctx context.Context, folder *entity.Folder) error
	Delete(ctx context.Context, id string) error
	Move(ctx context.Context, folderID string, newParentID *string) error
}
