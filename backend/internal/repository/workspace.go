package repository

import (
	"context"
	"errors"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	"github.com/Star1ex/starlex-site/internal/logger"
	"gorm.io/gorm"
)

type WorkspaceModel struct {
	ID          string      `gorm:"primaryKey"`
	Name        string      `gorm:"unique;not null"`
	Description string      `gorm:"not null"`
	Icon        string      `gorm:"not null;default:''"`
	OwnerID     string      `gorm:"not null"`
	Users       []UserModel `gorm:"many2many:users_workspaces"`
}

func fromDomainToWorkspace(workspace *entity.Workspace) *WorkspaceModel {
	return &WorkspaceModel{
		ID:          workspace.ID,
		Name:        workspace.Name,
		Description: workspace.Description,
		Icon:        workspace.Icon,
		OwnerID:     workspace.OwnerID,
	}
}

func toWorkspaceDomain(Workspace *WorkspaceModel) *entity.Workspace {
	return &entity.Workspace{
		ID:          Workspace.ID,
		Name:        Workspace.Name,
		Description: Workspace.Description,
		Icon:        Workspace.Icon,
		OwnerID:     Workspace.OwnerID,
	}
}

type WorkspaceRepository struct {
	db *gorm.DB
}

func NewWorkspaceRepository(db *gorm.DB) *WorkspaceRepository {
	return &WorkspaceRepository{
		db: db,
	}
}

func (t *WorkspaceRepository) CreateAndAddCreator(ctx context.Context, workspace *entity.Workspace, userID string) error {
	err := t.db.Transaction(func(tx *gorm.DB) error {
		//Creating workspace
		newWorkspace := fromDomainToWorkspace(workspace)
		newWorkspace.OwnerID = userID
		err := tx.WithContext(ctx).Create(newWorkspace).Error
		if err != nil {
			if errors.Is(err, gorm.ErrDuplicatedKey) {
				return ErrWorkspaceAlreadyExists
			}
			logger.Log.Errorw("create workspace failed", "error", err)
			return err
		}

		// Add creator to workspace
		creatorUser := UserModel{ID: userID}
		err = tx.WithContext(ctx).Model(newWorkspace).Association("Users").Append(&creatorUser)
		if err != nil {
			return err
		}

		// Set role to "owner" for the creator
		// Use Updates with map to ensure the update works correctly
		result := tx.WithContext(ctx).Model(&UserModel{}).Where("id = ?", userID).Updates(map[string]interface{}{
			"role": "owner",
		})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			logger.Log.Warnw("No rows updated when setting role to owner", "user_id", userID)
		}

		return nil
	})
	if err != nil {
		return err
	}
	return nil
}

func (t *WorkspaceRepository) GetWorkspace(ctx context.Context, workspaceId string) ([]*entity.User, error) {
	var workspaceModel WorkspaceModel
	err := t.db.WithContext(ctx).Preload("Users").First(&workspaceModel, "id = ?", workspaceId).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceNotFound
		}
		return nil, err
	}
	users := workspaceModel.Users
	usersInWorkspace := make([]*entity.User, len(users))
	for i, user := range users {
		if user.ID == workspaceModel.OwnerID {
			user.Role = "owner"
		} else {
			user.Role = "member"
		}
		usersInWorkspace[i] = toDomain(&user)
	}
	return usersInWorkspace, nil
}

func (r *WorkspaceRepository) Delete(ctx context.Context, workspaceID string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var workspace WorkspaceModel

		if err := tx.Preload("Users").
			First(&workspace, "id = ?", workspaceID).Error; err != nil {
			return err
		}

		// delete many2many
		if err := tx.Model(&workspace).
			Association("Users").Clear(); err != nil {
			return err
		}

		if err := tx.Delete(&workspace).Error; err != nil {
			return err
		}

		return nil
	})
}

// GetWorkspaceByID returns workspace by ID (used to check ownership)
func (t *WorkspaceRepository) GetWorkspaceByID(ctx context.Context, workspaceID string) (*entity.Workspace, error) {
	var workspaceModel WorkspaceModel
	err := t.db.WithContext(ctx).First(&workspaceModel, "id = ?", workspaceID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceNotFound
		}
		return nil, err
	}
	return toWorkspaceDomain(&workspaceModel), nil
}

func (t *WorkspaceRepository) UpdateName(ctx context.Context, workspaceID string, name string) error {
	result := t.db.WithContext(ctx).Model(&WorkspaceModel{}).Where("id = ?", workspaceID).Update("name", name)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrDuplicatedKey) {
			return ErrWorkspaceAlreadyExists
		}
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrWorkspaceNotFound
	}
	return nil
}

func (t *WorkspaceRepository) UpdateIcon(ctx context.Context, workspaceID string, icon string) error {
	result := t.db.WithContext(ctx).Model(&WorkspaceModel{}).Where("id = ?", workspaceID).Update("icon", icon)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrWorkspaceNotFound
	}
	return nil
}

func (t *WorkspaceRepository) UpdateDescription(ctx context.Context, workspaceID string, description string) error {
	result := t.db.WithContext(ctx).Model(&WorkspaceModel{}).Where("id = ?", workspaceID).Update("description", description)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrWorkspaceNotFound
	}
	return nil
}

// AddUserToWorkspace
func (t *WorkspaceRepository) AddUserToWorkspace(ctx context.Context, workspaceID string, userID string) error {
	return t.db.Transaction(func(tx *gorm.DB) error {
		var workspace WorkspaceModel
		if err := tx.WithContext(ctx).First(&workspace, "id = ?", workspaceID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrWorkspaceNotFound
			}
			return err
		}

		var user UserModel
		if err := tx.WithContext(ctx).First(&user, "id = ?", userID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrUserNotFound
			}
			return err
		}
		var count int64
		tx.WithContext(ctx).Model(&workspace).Where("id = ?", userID).Association("Users").Count()
		if count > 0 {
			return errors.New("user already in workspace")
		}

		if err := tx.WithContext(ctx).Model(&workspace).Association("Users").Append(&user); err != nil {
			return err
		}

		return nil
	})
}

func (t *WorkspaceRepository) RemoveUserFromWorkspace(ctx context.Context, workspaceID string, userID string) error {
	return t.db.Transaction(func(tx *gorm.DB) error {
		var workspace WorkspaceModel
		if err := tx.WithContext(ctx).First(&workspace, "id = ?", workspaceID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("workspace not found")
			}
			return err
		}

		// Check if user is the owner
		if workspace.OwnerID == userID {
			return errors.New("cannot remove workspace owner from workspace")
		}

		var user UserModel
		if err := tx.WithContext(ctx).First(&user, "id = ?", userID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("user not found")
			}
			return err
		}

		// Check if user is actually in the workspace
		var count int64
		count = tx.WithContext(ctx).Model(&workspace).Where("id = ?", userID).Association("Users").Count()
		if count == 0 {
			return errors.New("user is not in this workspace")
		}

		// Remove user from workspace
		if err := tx.WithContext(ctx).Model(&workspace).Association("Users").Delete(&user); err != nil {
			return err
		}

		return nil
	})
}
