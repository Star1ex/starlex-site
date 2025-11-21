package repository

import (
	"context"
	"errors"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"gorm.io/gorm"
)

type TaskModel struct {
	ID          string      `gorm:"primaryKey"`
	Task        string      `gorm:"unique;not null"`
	Description string      `gorm:"not null"`
	Priority    string      `gorm:"not null"`
	Assigned    []UserModel `gorm:"many2many:task_users"`
	TeamID      string      `gorm:"not null"`
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

	return &entity.Task{
		ID:          m.ID,
		Task:        m.Task,
		Description: m.Description,
		AssignedTo:  users,
		TeamID:      m.TeamID,
		Priority: 	 m.Priority,
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
		Priority: 	 t.Priority,
		TeamID:      t.TeamID,
	}
}

func (r *TaskRepository) Create(ctx context.Context, task *entity.Task) error {
	model := fromTaskDomain(task)
	return r.db.WithContext(ctx).Create(model).Error
}

func (r *TaskRepository) Get(ctx context.Context, id string) (*entity.Task, error) {
	var model TaskModel
	result := r.db.WithContext(ctx).Where("id = ?", id).First(&model)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, result.Error
	}
	return toTaskDomain(model), nil
}

func (r *TaskRepository) Update(ctx context.Context, id string, data *entity.UpdateTask) error {
	updates := map[string]interface{}{}

	if data.Task != "" {
		updates["task"] = data.Task
	}
	if data.Description != "" {
		updates["description"] = data.Description
	}

	if data.AssignedTo != nil {
		updates["assignedTo"] = data.AssignedTo
	}

	if data.Priority != "" {
		updates["priority"] = data.Priority
	}

	var task TaskModel
	if err := r.db.Model(&task).Where("id = ?", id).Updates(updates).Error; err != nil {
		return err
	}

	// reload full updated task
	r.db.First(&task, id)

	return nil
}

func (r *TaskRepository) Delete(ctx context.Context, id string) error {
	return r.db.Where("id = ?", id).Delete(&TaskModel{}).Error
}

func (r *TaskRepository) GetTeamTasks(ctx context.Context, teamID string) ([]*entity.Task, error) {
	var models []TaskModel

	err := r.db.WithContext(ctx).
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
