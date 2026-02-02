package service

import (
	"context"
	"errors"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"github.com/Team-Tracks/team-track-site/internal/domain/task"
	"github.com/Team-Tracks/team-track-site/internal/domain/team"
	"github.com/Team-Tracks/team-track-site/internal/domain/user"
	"github.com/Team-Tracks/team-track-site/internal/security"
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

func (s *TaskService) CreateTeamTask(
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

	// Handle assigned users - can be empty array
	var users []*entity.User
	if len(assignedIDs) > 0 {
		users, err = s.userRepo.GetByIDs(ctx, assignedIDs)
		if err != nil {
			return err
		}
	}
	// If assignedIDs is empty, users will be nil/empty, which is valid

	task.AssignedTo = users
	task.TeamID = teamID
	task.ID = uuid.New().String()

	return s.taskRepo.Create(ctx, task)
}

func (s *TaskService) CreatePersonalTask(ctx context.Context, task *entity.Task) error {
	task.ID = security.GenerateNewID()
	return s.taskRepo.Create(ctx, task)
}

func (s *TaskService) GetTaskByID(ctx context.Context, taskID string) (*entity.Task, error) {
	return s.taskRepo.Get(ctx, taskID)
}

func (s *TaskService) Update(ctx context.Context, id string, data *entity.Task, assignedTo []string) (*entity.Task, error) {
	return s.taskRepo.Update(ctx, id, data, assignedTo)
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

func (s *TaskService) UpdateTaskProgress(ctx context.Context, taskID, progress string) (*entity.Task, error) {
	updatedTask := &entity.Task{
		Progress: progress,
	}

	var main []string
	task, err := s.taskRepo.Update(ctx, taskID, updatedTask, main)
	if err != nil {
		return nil, err
	}
	return task, err
}

func (s *TaskService) Delete(ctx context.Context, id string) error {
	return s.taskRepo.Delete(ctx, id)
}

func (s *TaskService) GetTasksWithoutFolder(ctx context.Context, userID string) ([]*entity.Task, error) {
	return s.taskRepo.GetTasksWithoutFolder(ctx, userID)
}

func (s *TaskService) GetFolderTasks(ctx context.Context, folderID string) ([]*entity.Task, error) {
	return s.taskRepo.GetFolderTasks(ctx, folderID)
}

func (s *TaskService) MoveTaskToFolder(ctx context.Context, taskID, folderID string) error {
	return s.taskRepo.MoveTaskToFolder(ctx, taskID, folderID)
}
