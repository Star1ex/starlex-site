package service

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"github.com/Team-Tracks/team-track-site/internal/domain/task"
)

type TaskService struct {
	repo task.Repository
}

func NewTaskService(repo task.Repository) *TaskService {
	return &TaskService{
		repo: repo,
	}
}

func (s *TaskService) CreateTask(ctx context.Context, userID string, task *entity.Task) error {
	return nil
}
func (s *TaskService) GetTeamTasks(ctx context.Context, teamID string) ([]*entity.Task, error) {
	return nil, nil
}
func (s *TaskService) GetUserTasks(ctx context.Context, userID string) ([]*entity.Task, error) {
	return nil, nil
}
