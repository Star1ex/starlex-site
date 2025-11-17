package service

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"github.com/Team-Tracks/team-track-site/internal/domain/task"
)


type TaskService struct{
	repo task.Repository
}

func (s *TaskService) CreateTask(ctx context.Context, userId,task,description,teamID string)(*entity.Task,error){
	return nil,nil
}
func (s *TaskService) GetTeamTasks(ctx context.Context, teamID string)([]*entity.Task,error){
	return nil,nil
}
func (s *TaskService) GetUserTasks(ctx context.Context, userID string)([]*entity.Task,error){
	return nil,nil
}