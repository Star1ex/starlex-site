package service

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/domain/task"
)


type TaskService struct{
	repo task.Repository
}

func (s *TaskService) CreateTask(ctx context.Context, userId,task,description,teamID string)error{
	return nil
}