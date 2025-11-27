package service

import (
	"context"
	"errors"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"github.com/Team-Tracks/team-track-site/internal/domain/task"
	"github.com/Team-Tracks/team-track-site/internal/domain/user"
	"github.com/google/uuid"
)

type TaskService struct {
	taskRepo task.Repository
	userRepo user.Repository
}

func NewTaskService(taskRepo task.Repository, userRepo user.Repository) *TaskService {
	return &TaskService{
		taskRepo: taskRepo, userRepo: userRepo,
	}
}

func (s *TaskService) CreateTask(
	ctx context.Context,
	teamID string,
	assignedIDs []string,
	task *entity.Task,
	userId string,
) error {
	owner,err := s.userRepo.GetByID(ctx,userId)
	if err != nil{
		return err
	}
	if owner.Role != "owner"{
		return errors.New("now allowed for this user")
	}
	users, err := s.userRepo.GetByIDs(ctx, assignedIDs)
	if err != nil {
		return err
	}

	task.AssignedTo = users
	task.TeamID = teamID
	task.ID = uuid.New().String()

	return s.taskRepo.Create(ctx, task)
}
func (s *TaskService) GetTeamTasks(ctx context.Context, teamID string) ([]*entity.Task, error) {
	tasks, err := s.taskRepo.GetTeamTasks(ctx, teamID)
	if err != nil {
		return nil, err
	}
	return tasks, nil
}

func (s *TaskService) GetUserTasks(ctx context.Context, userID string) ([]*entity.Task, error) {
	tasks, err := s.taskRepo.GetUserTasks(ctx, userID)
	if err != nil {
		return nil, err
	}
	return tasks, nil
}


func (s *TaskService) UpdateTaskProgress(ctx context.Context, taskID,progress string )(error,*entity.Task){
	updatedTask:=&entity.Task{
		Progress: progress,
	}
	
	
	err,task := s.taskRepo.Update(ctx,taskID,updatedTask)
	if err != nil{
		return err,nil
	}
	return nil,task
}