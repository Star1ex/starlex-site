package repository

import (
	"context"
	"errors"
	"time"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"gorm.io/gorm"
)

type TaskModel struct {
	ID          string `gorm:"primaryKey"`
	Task        string `gorm:"not null"`
	Description string `gorm:"not null"`
	Priority    string `gorm:"not null"`
	Progress    string
	Assigned    []UserModel `gorm:"many2many:task_users"`

	TeamID    *string `gorm:"default:null"`
	OwnerID   string  `gorm:"not null;index:idx_owner_folder"`
	FolderID  *string `gorm:"default:null;index:idx_owner_folder"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

type TaskRepository struct {
	db *gorm.DB
}

func NewTaskRepository(db *gorm.DB) *TaskRepository {
	return &TaskRepository{
		db: db,
	}
}

func toTaskDomain(m TaskModel) *entity.Task {
	users := make([]*entity.User, len(m.Assigned))
	for i, u := range m.Assigned {
		user := toDomain(&u)
		users[i] = user
	}

	teamID := ""
	if m.TeamID != nil {
		teamID = *m.TeamID
	}

	return &entity.Task{
		ID:          m.ID,
		Task:        m.Task,
		Description: m.Description,
		AssignedTo:  users,
		TeamID:      teamID,
		OwnerID:     m.OwnerID,
		FolderID:    m.FolderID,
		Priority:    m.Priority,
		Progress:    m.Progress,
		CreatedAt:   m.CreatedAt,
		UpdatedAt:   m.UpdatedAt,
	}
}
func toTaskDomains(tasks []TaskModel) []*entity.Task {
	response := make([]*entity.Task, len(tasks))
	for i, task := range tasks {
		response[i] = toTaskDomain(task)
	}
	return response
}

func fromTaskDomain(t *entity.Task) *TaskModel {
	users := make([]UserModel, len(t.AssignedTo))
	for i, u := range t.AssignedTo {
		users[i] = *fromDomain(u)
	}

	return &TaskModel{
		ID:          t.ID,
		Task:        t.Task,
		Description: t.Description,
		Assigned:    users,
		Priority:    t.Priority,
		OwnerID:     t.OwnerID,
		FolderID:    t.FolderID,
		TeamID:      &t.TeamID,
		CreatedAt:   t.CreatedAt,
		UpdatedAt:   t.UpdatedAt,
	}
}

func (r *TaskRepository) Create(ctx context.Context, task *entity.Task) error {
	model := fromTaskDomain(task)
	return r.db.WithContext(ctx).Create(model).Error
}

func (r *TaskRepository) Get(ctx context.Context, id string) (*entity.Task, error) {
	var model TaskModel
	result := r.db.WithContext(ctx).
		Preload("Assigned").
		Where("id = ?", id).
		First(&model)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, result.Error
	}
	return toTaskDomain(model), nil
}

func (r *TaskRepository) Update(ctx context.Context, id string, data *entity.Task, assigned []string) (*entity.Task, error) {
	var task TaskModel
	if err := r.db.Preload("Assigned").Where("id = ?", id).First(&task).Error; err != nil {
		return nil, err
	}

	updates := map[string]interface{}{}
	if data.Task != "" {
		updates["task"] = data.Task
	}
	if data.Description != "" {
		updates["description"] = data.Description
	}
	if data.Priority != "" {
		updates["priority"] = data.Priority
	}
	if data.Progress != "" {
		updates["progress"] = data.Progress
	}

	if len(updates) > 0 {
		if err := r.db.Model(&task).Updates(updates).Error; err != nil {
			return nil, err
		}
	}

	if assigned != nil {
		var users []UserModel
		if err := r.db.Where("id IN ?", assigned).Find(&users).Error; err != nil {
			return nil, err
		}
		if err := r.db.Model(&task).Association("Assigned").Replace(users); err != nil {
			return nil, err
		}
	}

	if err := r.db.Preload("Assigned").Where("id = ?", id).First(&task).Error; err != nil {
		return nil, err
	}

	return toTaskDomain(task), nil
}

func (r *TaskRepository) UpdateTitle(ctx context.Context, id string, title string) error {
	result := r.db.WithContext(ctx).Model(&TaskModel{}).Where("id = ?", id).Update("task", title)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *TaskRepository) UpdateDescription(ctx context.Context, id string, description string) error {
	result := r.db.WithContext(ctx).Model(&TaskModel{}).Where("id = ?", id).Update("description", description)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *TaskRepository) UpdatePriority(ctx context.Context, id string, priority string) error {
	result := r.db.WithContext(ctx).Model(&TaskModel{}).Where("id = ?", id).Update("priority", priority)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *TaskRepository) UpdateProgress(ctx context.Context, id string, progress string) error {
	result := r.db.WithContext(ctx).Model(&TaskModel{}).Where("id = ?", id).Update("progress", progress)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *TaskRepository) UpdateAssignees(ctx context.Context, id string, assigned []string) error {
	var task TaskModel
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&task).Error; err != nil {
		return err
	}

	var users []UserModel
	if len(assigned) > 0 {
		if err := r.db.WithContext(ctx).Where("id IN ?", assigned).Find(&users).Error; err != nil {
			return err
		}
	}

	if err := r.db.WithContext(ctx).Model(&task).Association("Assigned").Replace(users); err != nil {
		return err
	}

	return nil
}

func (r *TaskRepository) Delete(ctx context.Context, id string) error {
	var task TaskModel
	if err := r.db.Preload("Assigned").Where("id = ?", id).First(&task).Error; err != nil {
		return err
	}
	if err := r.db.Model(&task).Association("Assigned").Clear(); err != nil {
		return err
	}

	return r.db.Delete(&task).Error
}

func (r *TaskRepository) GetTeamTasks(ctx context.Context, teamID string) ([]*entity.Task, error) {
	var models []TaskModel

	err := r.db.WithContext(ctx).
		Preload("Assigned").
		Where("team_id = ?", teamID).
		Find(&models).Error

	if err != nil {
		return nil, err
	}

	return toTaskDomains(models), nil
}

func (r *TaskRepository) GetUserTasks(ctx context.Context, userID string) ([]*entity.Task, error) {
	var models []TaskModel

	err := r.db.WithContext(ctx).
		Joins("JOIN task_users tu ON tu.task_model_id = task_models.id").
		Where("tu.user_id = ?", userID).
		Find(&models).Error

	if err != nil {
		return nil, err
	}

	return toTaskDomains(models), nil
}

func (r *TaskRepository) GetFolderTasks(ctx context.Context, folderID string) ([]*entity.Task, error) {
	var models []TaskModel

	err := r.db.WithContext(ctx).
		Where("folder_id = ?", folderID).
		Find(&models).Error

	if err != nil {
		return nil, err
	}
	return toTaskDomains(models), nil
}

func (r *TaskRepository) MoveTaskToFolder(ctx context.Context, taskID, folderID string) error {
	var task TaskModel
	if err := r.db.Preload("Assigned").Where("id = ?", taskID).First(&task).Error; err != nil {
		return err
	}
	if err := r.db.Model(&task).Update("folder_id", folderID).Error; err != nil {
		return err
	}
	return nil
}

func (r *TaskRepository) GetTasksWithoutFolder(ctx context.Context, userID string) ([]*entity.Task, error) {
	var models []TaskModel
	err := r.db.WithContext(ctx).
		Where("folder_id IS NULL AND owner_id = ?", userID).
		Find(&models).Error

	if err != nil {
		return nil, err
	}
	return toTaskDomains(models), nil
}
