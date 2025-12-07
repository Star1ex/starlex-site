package service

import (
	"context"
	"errors"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"github.com/Team-Tracks/team-track-site/internal/domain/task"
	"github.com/Team-Tracks/team-track-site/internal/domain/team"
	"github.com/Team-Tracks/team-track-site/internal/domain/user"
	"github.com/google/uuid"
)

type TaskService struct {
	taskRepo task.Repository
	userRepo user.Repository
	teamRepo team.Repository
}

func NewTaskService(taskRepo task.Repository, userRepo user.Repository, teamRepo team.Repository) *TaskService {
	return &TaskService{
		taskRepo: taskRepo,
		userRepo: userRepo,
		teamRepo: teamRepo,
	}
}

func (s *TaskService) CreateTask(
	ctx context.Context,
	teamID string,
	assignedIDs []string,
	task *entity.Task,
	userId string,
) error {
	// Check if team exists and user is the owner of this specific team
	team, err := s.teamRepo.GetTeamByID(ctx, teamID)
	if err != nil {
		return err
	}

	// Verify that the user is the owner of this team
	if team.OwnerID != userId {
		return errors.New("not allowed for this user: only team owner can create tasks")
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

func (s *TaskService) UpdateTaskProgress(ctx context.Context, taskID, progress string) (error, *entity.Task) {
	updatedTask := &entity.Task{
		Progress: progress,
	}

	err, task := s.taskRepo.Update(ctx, taskID, updatedTask)
	if err != nil {
		return err, nil
	}
	return nil, task
}
