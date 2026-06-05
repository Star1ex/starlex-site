package service

import (
	"context"
	"errors"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	"github.com/Star1ex/starlex-site/internal/domain/task"
	"github.com/Star1ex/starlex-site/internal/domain/team"
	"github.com/Star1ex/starlex-site/internal/domain/user"
	"github.com/Star1ex/starlex-site/internal/security"
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
	if err := s.taskRepo.UpdateProgress(ctx, taskID, progress); err != nil {
		return nil, err
	}
	return s.taskRepo.Get(ctx, taskID)
}

func (s *TaskService) UpdateTaskIcon(ctx context.Context, taskID, icon string) error {
	return s.taskRepo.UpdateIcon(ctx, taskID, icon)
}

func (s *TaskService) UpdateTaskTitle(ctx context.Context, taskID, title string) error {
	return s.taskRepo.UpdateTitle(ctx, taskID, title)
}

func (s *TaskService) UpdateTaskDescription(ctx context.Context, taskID, description string) error {
	return s.taskRepo.UpdateDescription(ctx, taskID, description)
}

func (s *TaskService) UpdateTaskPriority(ctx context.Context, taskID, priority string) error {
	return s.taskRepo.UpdatePriority(ctx, taskID, priority)
}

func (s *TaskService) UpdateTaskStatus(ctx context.Context, taskID, progress string) error {
	return s.taskRepo.UpdateProgress(ctx, taskID, progress)
}

func (s *TaskService) UpdateTaskAssignees(ctx context.Context, taskID string, assignedTo []string) error {
	return s.taskRepo.UpdateAssignees(ctx, taskID, assignedTo)
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

func (s *TaskService) SearchInTeams(ctx context.Context, teamIDs []string, query string) ([]*entity.Task, error) {
	return s.taskRepo.SearchInTeams(ctx, teamIDs, query)
}
