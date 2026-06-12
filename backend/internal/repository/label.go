package repository

import (
	"context"
	"errors"
	"time"

	domainlabel "github.com/Star1ex/starlex-site/internal/domain/label"
	"gorm.io/gorm"
)

type LabelModel struct {
	ID          string `gorm:"primaryKey"`
	WorkspaceID string `gorm:"not null;index;uniqueIndex:idx_label_workspace_name"`
	Name        string `gorm:"not null;uniqueIndex:idx_label_workspace_name"`
	Color       string `gorm:"not null"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type LabelRepository struct {
	db *gorm.DB
}

func NewLabelRepository(db *gorm.DB) *LabelRepository {
	return &LabelRepository{db: db}
}

func fromLabelDomain(label *domainlabel.Label) *LabelModel {
	return &LabelModel{
		ID:          label.ID,
		WorkspaceID: label.WorkspaceID,
		Name:        label.Name,
		Color:       label.Color,
		CreatedAt:   label.CreatedAt,
		UpdatedAt:   label.UpdatedAt,
	}
}

func toLabelDomain(model *LabelModel) *domainlabel.Label {
	return &domainlabel.Label{
		ID:          model.ID,
		WorkspaceID: model.WorkspaceID,
		Name:        model.Name,
		Color:       model.Color,
		CreatedAt:   model.CreatedAt,
		UpdatedAt:   model.UpdatedAt,
	}
}

func toLabelDomains(models []LabelModel) []*domainlabel.Label {
	labels := make([]*domainlabel.Label, len(models))
	for i := range models {
		labels[i] = toLabelDomain(&models[i])
	}
	return labels
}

func (r *LabelRepository) Create(ctx context.Context, label *domainlabel.Label) error {
	return r.db.WithContext(ctx).Create(fromLabelDomain(label)).Error
}

func (r *LabelRepository) GetByID(ctx context.Context, id string) (*domainlabel.Label, error) {
	var model LabelModel
	err := r.db.WithContext(ctx).First(&model, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domainlabel.ErrLabelNotFound
		}
		return nil, err
	}
	return toLabelDomain(&model), nil
}

func (r *LabelRepository) ListByWorkspace(ctx context.Context, workspaceID string) ([]*domainlabel.Label, error) {
	var models []LabelModel
	err := r.db.WithContext(ctx).
		Where("workspace_id = ?", workspaceID).
		Order("name ASC").
		Find(&models).Error
	if err != nil {
		return nil, err
	}
	return toLabelDomains(models), nil
}

func (r *LabelRepository) Update(ctx context.Context, id string, name *string, color *string) (*domainlabel.Label, error) {
	updates := map[string]interface{}{}
	if name != nil {
		updates["name"] = *name
	}
	if color != nil {
		updates["color"] = *color
	}
	if len(updates) > 0 {
		result := r.db.WithContext(ctx).Model(&LabelModel{}).Where("id = ?", id).Updates(updates)
		if result.Error != nil {
			return nil, result.Error
		}
		if result.RowsAffected == 0 {
			return nil, domainlabel.ErrLabelNotFound
		}
	}
	return r.GetByID(ctx, id)
}

func (r *LabelRepository) Delete(ctx context.Context, id string) error {
	result := r.db.WithContext(ctx).Delete(&LabelModel{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return domainlabel.ErrLabelNotFound
	}
	return nil
}
