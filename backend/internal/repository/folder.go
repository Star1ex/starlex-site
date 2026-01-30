package repository

import (
	"context"
	"errors"
	"time"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"gorm.io/gorm"
)

type FolderModel struct {
	ID       string  `gorm:"primaryKey"`
	Name     string  `gorm:"not null"`
	Color    string  `gorm:"default: '#gray'"`
	Icon     string  `gorm:"default:null"`
	ParentID *string `gorm:"default:null;index"`

	TeamID  *string `gorm:"default:null;index"`
	OwnerID string  `gorm:"not null;index"`

	Position int `gorm:"default:0"`

	CreatedAt time.Time
	UpdatedAt time.Time
}

type FolderRepository struct {
	db *gorm.DB
}

func NewFolderRepository(db *gorm.DB) *FolderRepository {
	return &FolderRepository{
		db: db,
	}
}

func toFolderDomain(folder FolderModel) *entity.Folder {
	return &entity.Folder{
		ID:        folder.ID,
		Name:      folder.Name,
		Color:     folder.Color,
		Icon:      folder.Icon,
		ParentID:  folder.ParentID,
		TeamID:    folder.TeamID,
		OwnerID:   folder.OwnerID,
		Position:  folder.Position,
		CreatedAt: folder.CreatedAt,
		UpdatedAt: folder.UpdatedAt,
	}
}

func toFolderDomains(folders []FolderModel) []*entity.Folder {
	response := make([]*entity.Folder, len(folders))
	for i, folder := range folders {
		response[i] = toFolderDomain(folder)
	}
	return response
}

func fromFolderDomain(folder *entity.Folder) *FolderModel {
	return &FolderModel{
		ID:        folder.ID,
		Name:      folder.Name,
		Color:     folder.Color,
		Icon:      folder.Icon,
		ParentID:  folder.ParentID,
		TeamID:    folder.TeamID,
		OwnerID:   folder.OwnerID,
		Position:  folder.Position,
		CreatedAt: folder.CreatedAt,
		UpdatedAt: folder.UpdatedAt,
	}
}

// make a new folder
func (r *FolderRepository) Create(ctx context.Context, folder *entity.Folder) error {
	return r.db.WithContext(ctx).Create(fromFolderDomain(folder)).Error
}

// return folder by ID
func (r *FolderRepository) GetByID(ctx context.Context, id string) (*entity.Folder, error) {
	var folder FolderModel
	result := r.db.WithContext(ctx).
		Where("id = ?", id).
		First(&folder)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, result.Error
	}
	return toFolderDomain(folder), nil
}

// retrieves all user folders
func (r *FolderRepository) GetUserFolders(ctx context.Context, userID string) ([]*entity.Folder, error) {
	var folders []FolderModel
	result := r.db.WithContext(ctx).
		Where("owner_id = ?", userID).
		Find(&folders)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, result.Error
	}
	return toFolderDomains(folders), nil
}

// retrieves all team folders
func (r *FolderRepository) GetTeamFolders(ctx context.Context, teamID string) ([]*entity.Folder, error) {
	var folders []FolderModel
	result := r.db.WithContext(ctx).
		Where("team_id = ?", teamID).
		Find(&folders)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, result.Error
	}
	return toFolderDomains(folders), nil
}

// retrieves all sub folders by parentID
func (r *FolderRepository) GetSubFolders(ctx context.Context, parentID string) ([]*entity.Folder, error) {
	var folders []FolderModel
	result := r.db.WithContext(ctx).
		Where("parent_id = ?", parentID).
		Find(&folders)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, result.Error
	}
	return toFolderDomains(folders), nil
}

// update folder by argm parameters
func (r *FolderRepository) Update(ctx context.Context, folder *entity.Folder) error {
	folderModel := fromFolderDomain(folder)
	result := r.db.WithContext(ctx).
		Where("id = ?", folderModel.ID).
		First(folderModel)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return gorm.ErrRecordNotFound
		}
	}

	updates := map[string]interface{}{}
	if folder.Name != "" {
		updates["name"] = folder.Name
	}
	if folder.Color != "" {
		updates["color"] = folder.Color
	}
	if folder.Icon != "" {
		updates["icon"] = folder.Icon
	}
	if folder.ParentID != nil {
		updates["parent_id"] = folder.ParentID
	}
	if folder.Position != 0 {
		updates["position"] = folder.Position
	}

	if len(updates) > 0 {
		if err := r.db.WithContext(ctx).Model(&folderModel).Updates(updates).Error; err != nil {
			return err
		}
	}
	return nil
}

// delete folder by ID
func (r *FolderRepository) Delete(ctx context.Context, id string) error {
	var folder FolderModel
	result := r.db.WithContext(ctx).
		Where("id = ?", id).
		First(folder)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return gorm.ErrRecordNotFound
		}
		return result.Error
	}
	return r.db.WithContext(ctx).Delete(folder).Error
}

// change parentID
func (r *FolderRepository) Move(ctx context.Context, folderID string, newParentID *string) error {
	var folder FolderModel

	result := r.db.WithContext(ctx).
		Where("id = ?", folderID).
		First(folder)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return gorm.ErrRecordNotFound
		}
		return result.Error
	}
	return r.db.WithContext(ctx).Model(folder).Update("parent_id", newParentID).Error
}
