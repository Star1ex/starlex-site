package folder

import "github.com/Team-Tracks/team-track-site/internal/domain/entity"

// folder Repository interfaces
type Repository interface {
	Create(folder *entity.Folder) error

	GetByID(id string) (*entity.Folder, error)
	GetUserFolders(userID string) ([]*entity.Folder, error)
	GetTeamFolders(teamID string) ([]*entity.Folder, error)
	GetSubFolders(parentID string) ([]*entity.Folder, error)

	Update(folder *entity.Folder) error
	Delete(id string) error
	Move(folderID string, newParentID *string) error
}
