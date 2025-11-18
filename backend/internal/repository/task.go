package repository

import (
	"context"
	"errors"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"gorm.io/gorm"
)

type TaskModel struct {
	ID          string        `gorm:"primaryKey"`
	Task        string        `gorm:"unique;not null"`
	Description string        `gorm:"not null"`
	Assigned    []entity.User `gorm:"many2many:task_users"`
	TeamID      string        `gorm:"not null"`
}

type TaskRepository struct {
	db *gorm.DB
}

func NewTaskRepository(db *gorm.DB) *TaskRepository {
	return &TaskRepository{
		db: db,
	}
}

func toTaskDomain(task TaskModel) *entity.Task {
	return &entity.Task{
		ID:          task.ID,
		Task:        task.Task,
		Description: task.Description,
		AssignedTo:  task.Assigned,
		TeamID:      task.TeamID,
	}
}

func toTaskDomains(tasks []TaskModel) []*entity.Task {
	response := make([]*entity.Task, len(tasks))
	for i, task := range tasks {
		response[i] = toTaskDomain(task)
	}
	return response
}

func fromDomainToTaskModel(task *entity.Task) *TaskModel {
	return &TaskModel{
		ID:          task.ID,
		Task:        task.Task,
		Description: task.Description,
		Assigned:    task.AssignedTo,
		TeamID:      task.TeamID,
	}
}

func (r *TaskRepository) Create(ctx context.Context, task *entity.Task) error {
	err := r.db.WithContext(ctx).Create(fromDomainToTaskModel(task)).Error
	if err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return ErrAlreadyExists
		}
		return err
	}
	return nil
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
	result := r.db.WithContext(ctx).Where("team_id = ?", teamID).First(&models)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, result.Error
	}
	return toTaskDomains(models), nil
}

func (r *TaskRepository) GetUserTasks(ctx context.Context, userID string) ([]*entity.Task, error) {
	return nil, nil
}
