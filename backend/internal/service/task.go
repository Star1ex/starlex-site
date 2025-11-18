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
	err := s.repo.Create(ctx, task)
	if err != nil {
		return err
	}
	return nil
}
func (s *TaskService) GetTeamTasks(ctx context.Context, teamID string) ([]*entity.Task, error) {
	tasks, err := s.repo.GetTeamTasks(ctx, teamID)
	if err != nil {
		return nil, err
	}
	return tasks, nil
}

func (s *TaskService) GetUserTasks(ctx context.Context, userID string) ([]*entity.Task, error) {
	tasks, err := s.repo.GetUserTasks(ctx, userID)
	if err != nil {
		return nil, err
	}
	return tasks, nil
}
