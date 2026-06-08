package repository

import (
	"context"
	"errors"
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	domainworkspace "github.com/Star1ex/starlex-site/internal/domain/workspace"
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

type WorkspaceMemberModel struct {
	WorkspaceID string         `gorm:"primaryKey;index"`
	UserID      string         `gorm:"primaryKey;index"`
	Role        string         `gorm:"not null;default:'member';index"`
	JoinedAt    time.Time      `gorm:"autoCreateTime"`
	Workspace   WorkspaceModel `gorm:"foreignKey:WorkspaceID"`
	User        UserModel      `gorm:"foreignKey:UserID"`
}

func (WorkspaceMemberModel) TableName() string {
	return "workspace_members"
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

		member := WorkspaceMemberModel{
			WorkspaceID: newWorkspace.ID,
			UserID:      userID,
			Role:        string(domainworkspace.RoleOwner),
		}
		if err := tx.WithContext(ctx).Create(&member).Error; err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return err
	}
	return nil
}

func (t *WorkspaceRepository) GetWorkspace(ctx context.Context, workspaceId string) ([]*entity.User, error) {
	members, err := t.ListMembers(ctx, workspaceId)
	if err != nil {
		return nil, err
	}
	users := make([]*entity.User, len(members))
	for i, member := range members {
		users[i] = member.User
	}
	return users, nil
}

func (r *WorkspaceRepository) Delete(ctx context.Context, workspaceID string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var workspace WorkspaceModel

		if err := tx.WithContext(ctx).Preload("Users").
			First(&workspace, "id = ?", workspaceID).Error; err != nil {
			return err
		}

		// delete many2many
		if err := tx.Model(&workspace).
			Association("Users").Clear(); err != nil {
			return err
		}

		if err := tx.WithContext(ctx).Delete(&workspace).Error; err != nil {
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
	return t.AddMember(ctx, workspaceID, userID, domainworkspace.RoleMember)
}

func (t *WorkspaceRepository) RemoveUserFromWorkspace(ctx context.Context, workspaceID string, userID string) error {
	result := t.db.WithContext(ctx).
		Where("workspace_id = ? AND user_id = ?", workspaceID, userID).
		Delete(&WorkspaceMemberModel{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrUserNotInWorkspace
	}
	return nil
}

func (t *WorkspaceRepository) ListMembers(ctx context.Context, workspaceID string) ([]*domainworkspace.Member, error) {
	var workspace WorkspaceModel
	if err := t.db.WithContext(ctx).First(&workspace, "id = ?", workspaceID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrWorkspaceNotFound
		}
		return nil, err
	}

	var models []WorkspaceMemberModel
	if err := t.db.WithContext(ctx).
		Preload("User").
		Where("workspace_id = ?", workspaceID).
		Order("joined_at ASC").
		Find(&models).Error; err != nil {
		return nil, err
	}

	members := make([]*domainworkspace.Member, len(models))
	for i, model := range models {
		userEntity := toDomain(&model.User)
		userEntity.Role = model.Role
		members[i] = &domainworkspace.Member{
			User:     userEntity,
			Role:     domainworkspace.Role(model.Role),
			JoinedAt: model.JoinedAt,
		}
	}
	return members, nil
}

func (t *WorkspaceRepository) GetRole(ctx context.Context, workspaceID, userID string) (domainworkspace.Role, error) {
	var member WorkspaceMemberModel
	err := t.db.WithContext(ctx).
		Where("workspace_id = ? AND user_id = ?", workspaceID, userID).
		First(&member).Error
	if err != nil {
		return "", err
	}
	role, err := domainworkspace.ParseRole(member.Role)
	if err != nil {
		return "", err
	}
	return role, nil
}

func (t *WorkspaceRepository) CountOwners(ctx context.Context, workspaceID string) (int64, error) {
	var count int64
	err := t.db.WithContext(ctx).Model(&WorkspaceMemberModel{}).
		Where("workspace_id = ? AND role = ?", workspaceID, string(domainworkspace.RoleOwner)).
		Count(&count).Error
	return count, err
}

func (t *WorkspaceRepository) CountMembers(ctx context.Context, workspaceID string) (int64, error) {
	var count int64
	err := t.db.WithContext(ctx).Model(&WorkspaceMemberModel{}).
		Where("workspace_id = ?", workspaceID).
		Count(&count).Error
	return count, err
}

func (t *WorkspaceRepository) AddMember(ctx context.Context, workspaceID, userID string, role domainworkspace.Role) error {
	return t.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
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
		if err := tx.WithContext(ctx).Model(&WorkspaceMemberModel{}).
			Where("workspace_id = ? AND user_id = ?", workspaceID, userID).
			Count(&count).Error; err != nil {
			return err
		}
		if count > 0 {
			return ErrUserAlreadyInWorkspace
		}

		return tx.WithContext(ctx).Create(&WorkspaceMemberModel{
			WorkspaceID: workspaceID,
			UserID:      userID,
			Role:        string(role),
		}).Error
	})
}

func (t *WorkspaceRepository) UpdateMemberRole(ctx context.Context, workspaceID, userID string, role domainworkspace.Role) error {
	result := t.db.WithContext(ctx).Model(&WorkspaceMemberModel{}).
		Where("workspace_id = ? AND user_id = ?", workspaceID, userID).
		Update("role", string(role))
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrUserNotInWorkspace
	}
	return nil
}
