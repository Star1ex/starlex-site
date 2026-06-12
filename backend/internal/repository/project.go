package repository

import (
	"context"
	"errors"
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	domainproject "github.com/Star1ex/starlex-site/internal/domain/project"
	"gorm.io/gorm"
)

// ProjectModel is the GORM persistence model for a project. Members are a
// many-to-many relation; the join table project_members has columns
// project_model_id and user_model_id (GORM defaults).
type ProjectModel struct {
	ID          string      `gorm:"primaryKey"`
	WorkspaceID string      `gorm:"not null;index:idx_project_workspace"`
	Name        string      `gorm:"not null"`
	Description string      `gorm:"not null;default:''"`
	Goal        string      `gorm:"not null;default:''"`
	Icon        string      `gorm:"not null;default:''"`
	Priority    string      `gorm:"not null;default:'none'"`
	Status      string      `gorm:"not null;default:'backlog';index"`
	LeaderID    string      `gorm:"not null"`
	CreatedBy   string      `gorm:"not null;index"`
	Deadline    *time.Time  `gorm:"default:null"`
	Members     []UserModel `gorm:"many2many:project_members"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func toProjectDomain(m *ProjectModel) *entity.Project {
	members := make([]*entity.User, len(m.Members))
	for i := range m.Members {
		u := m.Members[i]
		members[i] = toDomain(&u)
	}
	return &entity.Project{
		ID:          m.ID,
		WorkspaceID: m.WorkspaceID,
		Name:        m.Name,
		Description: m.Description,
		Goal:        m.Goal,
		Icon:        m.Icon,
		Priority:    m.Priority,
		Status:      m.Status,
		LeaderID:    m.LeaderID,
		CreatedBy:   m.CreatedBy,
		Deadline:    m.Deadline,
		Members:     members,
		CreatedAt:   m.CreatedAt,
		UpdatedAt:   m.UpdatedAt,
	}
}

func toProjectDomains(models []ProjectModel) []*entity.Project {
	out := make([]*entity.Project, len(models))
	for i := range models {
		out[i] = toProjectDomain(&models[i])
	}
	return out
}

func fromProjectDomain(p *entity.Project) *ProjectModel {
	return &ProjectModel{
		ID:          p.ID,
		WorkspaceID: p.WorkspaceID,
		Name:        p.Name,
		Description: p.Description,
		Goal:        p.Goal,
		Icon:        p.Icon,
		Priority:    p.Priority,
		Status:      p.Status,
		LeaderID:    p.LeaderID,
		CreatedBy:   p.CreatedBy,
		Deadline:    p.Deadline,
		CreatedAt:   p.CreatedAt,
		UpdatedAt:   p.UpdatedAt,
	}
}

type ProjectRepository struct {
	db *gorm.DB
}

func NewProjectRepository(db *gorm.DB) *ProjectRepository {
	return &ProjectRepository{db: db}
}

// Create persists the project and attaches its initial members in one transaction.
func (r *ProjectRepository) Create(ctx context.Context, project *entity.Project) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		model := fromProjectDomain(project)
		if err := tx.Create(model).Error; err != nil {
			return err
		}
		if len(project.Members) > 0 {
			ids := make([]string, len(project.Members))
			for i, m := range project.Members {
				ids[i] = m.ID
			}
			var users []UserModel
			if err := tx.Where("id IN ?", ids).Find(&users).Error; err != nil {
				return err
			}
			if err := tx.Model(model).Association("Members").Replace(users); err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *ProjectRepository) GetByID(ctx context.Context, id string) (*entity.Project, error) {
	var model ProjectModel
	err := r.db.WithContext(ctx).Preload("Members").First(&model, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domainproject.ErrProjectNotFound
		}
		return nil, err
	}
	return toProjectDomain(&model), nil
}

func (r *ProjectRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var model ProjectModel
		if err := tx.First(&model, "id = ?", id).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return domainproject.ErrProjectNotFound
			}
			return err
		}
		if err := tx.Model(&model).Association("Members").Clear(); err != nil {
			return err
		}
		// Detach tasks from the project so they are not orphaned/deleted.
		if err := tx.Model(&TaskModel{}).Where("project_id = ?", id).Update("project_id", nil).Error; err != nil {
			return err
		}
		return tx.Delete(&model).Error
	})
}

// Update applies only the provided (non-nil) fields and returns the reloaded project.
func (r *ProjectRepository) Update(ctx context.Context, id string, fields *domainproject.UpdateFields) (*entity.Project, error) {
	updates := map[string]interface{}{}
	if fields.Name != nil {
		updates["name"] = *fields.Name
	}
	if fields.Description != nil {
		updates["description"] = *fields.Description
	}
	if fields.Goal != nil {
		updates["goal"] = *fields.Goal
	}
	if fields.Icon != nil {
		updates["icon"] = *fields.Icon
	}
	if fields.Priority != nil {
		updates["priority"] = *fields.Priority
	}
	if fields.Status != nil {
		updates["status"] = *fields.Status
	}
	if fields.LeaderID != nil {
		updates["leader_id"] = *fields.LeaderID
	}
	if fields.Deadline != nil {
		updates["deadline"] = *fields.Deadline // may be nil -> clears the deadline
	}

	if len(updates) > 0 {
		result := r.db.WithContext(ctx).Model(&ProjectModel{}).Where("id = ?", id).Updates(updates)
		if result.Error != nil {
			return nil, result.Error
		}
		if result.RowsAffected == 0 {
			return nil, domainproject.ErrProjectNotFound
		}
	}

	return r.GetByID(ctx, id)
}

func (r *ProjectRepository) GetMembers(ctx context.Context, projectID string) ([]*entity.User, error) {
	var model ProjectModel
	err := r.db.WithContext(ctx).Preload("Members").First(&model, "id = ?", projectID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domainproject.ErrProjectNotFound
		}
		return nil, err
	}
	members := make([]*entity.User, len(model.Members))
	for i := range model.Members {
		u := model.Members[i]
		members[i] = toDomain(&u)
	}
	return members, nil
}

func (r *ProjectRepository) IsMember(ctx context.Context, projectID, userID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Table("project_members").
		Where("project_model_id = ? AND user_model_id = ?", projectID, userID).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *ProjectRepository) AddMember(ctx context.Context, projectID, userID string) error {
	var project ProjectModel
	if err := r.db.WithContext(ctx).First(&project, "id = ?", projectID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return domainproject.ErrProjectNotFound
		}
		return err
	}
	var user UserModel
	if err := r.db.WithContext(ctx).First(&user, "id = ?", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrUserNotFound
		}
		return err
	}
	return r.db.WithContext(ctx).Model(&project).Association("Members").Append(&user)
}

func (r *ProjectRepository) RemoveMember(ctx context.Context, projectID, userID string) error {
	var project ProjectModel
	if err := r.db.WithContext(ctx).First(&project, "id = ?", projectID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return domainproject.ErrProjectNotFound
		}
		return err
	}
	return r.db.WithContext(ctx).Model(&project).Association("Members").Delete(&UserModel{ID: userID})
}

// GetWorkspaceProjects returns projects in a workspace that the user is a member of.
func (r *ProjectRepository) GetWorkspaceProjects(ctx context.Context, workspaceID, userID string) ([]*entity.Project, error) {
	var models []ProjectModel
	err := r.db.WithContext(ctx).
		Joins("JOIN project_members pm ON pm.project_model_id = project_models.id").
		Where("pm.user_model_id = ? AND project_models.workspace_id = ?", userID, workspaceID).
		Preload("Members").
		Order("created_at DESC").
		Find(&models).Error
	if err != nil {
		return nil, err
	}
	return toProjectDomains(models), nil
}
