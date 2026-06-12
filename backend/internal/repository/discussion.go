package repository

import (
	"context"
	"errors"
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	"gorm.io/gorm"
)

type DiscussionModel struct {
	ID          string  `gorm:"primaryKey"`
	Title       string  `gorm:"not null;default:''"`
	TaskID      *string `gorm:"index:idx_discussion_task"`
	WorkspaceID *string `gorm:"index:idx_discussion_workspace"`
	CreatedBy   string  `gorm:"not null"`
	IsResolved  bool    `gorm:"not null;default:false"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	Messages    []DiscussionMessageModel `gorm:"foreignKey:DiscussionID"`
}

type DiscussionMessageModel struct {
	ID           string    `gorm:"primaryKey"`
	DiscussionID string    `gorm:"not null;index:idx_message_discussion"`
	AuthorID     string    `gorm:"not null"`
	Content      string    `gorm:"not null;default:''"`
	ContentType  string    `gorm:"not null;default:'markdown'"`
	CreatedAt    time.Time `gorm:"index:idx_message_discussion"`
	UpdatedAt    time.Time
	Author       UserModel `gorm:"foreignKey:AuthorID"`
}

type DiscussionRepository struct {
	db *gorm.DB
}

func NewDiscussionRepository(db *gorm.DB) *DiscussionRepository {
	return &DiscussionRepository{db: db}
}

func toDiscussionDomain(model DiscussionModel) *entity.Discussion {
	return &entity.Discussion{
		ID:          model.ID,
		Title:       model.Title,
		TaskID:      model.TaskID,
		WorkspaceID: model.WorkspaceID,
		CreatedBy:   model.CreatedBy,
		IsResolved:  model.IsResolved,
		CreatedAt:   model.CreatedAt,
		UpdatedAt:   model.UpdatedAt,
		Messages:    toDiscussionMessagesDomain(model.Messages),
	}
}

func toDiscussionDomains(models []DiscussionModel) []*entity.Discussion {
	response := make([]*entity.Discussion, len(models))
	for i, model := range models {
		response[i] = toDiscussionDomain(model)
	}
	return response
}

func toDiscussionMessageDomain(model DiscussionMessageModel) *entity.DiscussionMessage {
	var author *entity.User
	if model.Author.ID != "" {
		author = toDomain(&model.Author)
	}
	return &entity.DiscussionMessage{
		ID:           model.ID,
		DiscussionID: model.DiscussionID,
		AuthorID:     model.AuthorID,
		Content:      model.Content,
		ContentType:  model.ContentType,
		Author:       author,
		CreatedAt:    model.CreatedAt,
		UpdatedAt:    model.UpdatedAt,
	}
}

func toDiscussionMessagesDomain(models []DiscussionMessageModel) []*entity.DiscussionMessage {
	response := make([]*entity.DiscussionMessage, len(models))
	for i, model := range models {
		response[i] = toDiscussionMessageDomain(model)
	}
	return response
}

func fromDiscussionDomain(entity *entity.Discussion) *DiscussionModel {
	return &DiscussionModel{
		ID:          entity.ID,
		Title:       entity.Title,
		TaskID:      entity.TaskID,
		WorkspaceID: entity.WorkspaceID,
		CreatedBy:   entity.CreatedBy,
		IsResolved:  entity.IsResolved,
		CreatedAt:   entity.CreatedAt,
		UpdatedAt:   entity.UpdatedAt,
	}
}

func (r *DiscussionRepository) Create(ctx context.Context, discussion *entity.Discussion) error {
	return r.db.WithContext(ctx).Create(fromDiscussionDomain(discussion)).Error
}

func (r *DiscussionRepository) GetByID(ctx context.Context, id string) (*entity.Discussion, error) {
	var model DiscussionModel
	result := r.db.WithContext(ctx).
		Preload("Messages").
		Preload("Messages.Author").
		Where("id = ?", id).
		First(&model)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, result.Error
	}
	return toDiscussionDomain(model), nil
}

func (r *DiscussionRepository) GetByTask(ctx context.Context, taskID string) ([]*entity.Discussion, error) {
	var models []DiscussionModel
	if err := r.db.WithContext(ctx).
		Where("task_id = ?", taskID).
		Order("created_at DESC").
		Find(&models).Error; err != nil {
		return nil, err
	}
	return toDiscussionDomains(models), nil
}

func (r *DiscussionRepository) UpdateDiscussion(ctx context.Context, id string, updates map[string]interface{}) error {
	if len(updates) == 0 {
		return nil
	}
	return r.db.WithContext(ctx).Model(&DiscussionModel{}).
		Where("id = ?", id).
		Updates(updates).Error
}

func (r *DiscussionRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&DiscussionModel{}, "id = ?", id).Error
}

func (r *DiscussionRepository) CreateMessage(ctx context.Context, message *entity.DiscussionMessage) error {
	model := DiscussionMessageModel{
		ID:           message.ID,
		DiscussionID: message.DiscussionID,
		AuthorID:     message.AuthorID,
		Content:      message.Content,
		ContentType:  message.ContentType,
		CreatedAt:    message.CreatedAt,
		UpdatedAt:    message.UpdatedAt,
	}
	return r.db.WithContext(ctx).Create(&model).Error
}

func (r *DiscussionRepository) GetMessageByID(ctx context.Context, id string) (*entity.DiscussionMessage, error) {
	var model DiscussionMessageModel
	result := r.db.WithContext(ctx).
		Preload("Author").
		Where("id = ?", id).
		First(&model)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, result.Error
	}
	return toDiscussionMessageDomain(model), nil
}

func (r *DiscussionRepository) UpdateMessage(ctx context.Context, id string, updates map[string]interface{}) error {
	if len(updates) == 0 {
		return nil
	}
	return r.db.WithContext(ctx).Model(&DiscussionMessageModel{}).
		Where("id = ?", id).
		Updates(updates).Error
}

func (r *DiscussionRepository) DeleteMessage(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&DiscussionMessageModel{}, "id = ?", id).Error
}
