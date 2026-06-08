package service

import (
	"context"
	"errors"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	taskdomain "github.com/Star1ex/starlex-site/internal/domain/task"
	"github.com/Star1ex/starlex-site/internal/domain/user"
	"github.com/Star1ex/starlex-site/internal/domain/workspace"
	"github.com/google/uuid"
)

type TaskService struct {
	taskRepo      taskdomain.Repository
	userRepo      user.Repository
	workspaceRepo workspace.Repository
}

func NewTaskService(taskRepo taskdomain.Repository, userRepo user.Repository, workspaceRepo workspace.Repository) *TaskService {
	return &TaskService{
		taskRepo:      taskRepo,
		userRepo:      userRepo,
		workspaceRepo: workspaceRepo,
	}
}

func (s *TaskService) CreateWorkspaceTask(
	ctx context.Context,
	workspaceID string,
	assignedIDs []string,
	task *entity.Task,
	userId string,
) error {
	if workspaceID == "" {
		return errors.New("workspace id is required")
	}

	// Ensure the workspace exists. Membership authorization is enforced by the
	// API layer (any workspace member may create tasks).
	if _, err := s.workspaceRepo.GetWorkspaceByID(ctx, workspaceID); err != nil {
		return err
	}

	// Handle assigned users - can be empty array
	var users []*entity.User
	if len(assignedIDs) > 0 {
		var err error
		users, err = s.userRepo.GetByIDs(ctx, assignedIDs)
		if err != nil {
			return err
		}
	}
	// If assignedIDs is empty, users will be nil/empty, which is valid
	status, err := taskdomain.ParseStatus(task.Status)
	if err != nil {
		return err
	}

	task.AssignedTo = users
	task.WorkspaceID = workspaceID
	task.OwnerID = userId
	task.ID = uuid.New().String()
	task.Status = string(status)

	return s.taskRepo.Create(ctx, task)
}

// CreateProjectTask creates a task attached to a project. Project membership
// must be verified by the caller; the task inherits the project's workspace.
func (s *TaskService) CreateProjectTask(
	ctx context.Context,
	projectID, workspaceID string,
	assignedIDs []string,
	task *entity.Task,
) error {
	var users []*entity.User
	if len(assignedIDs) > 0 {
		var err error
		users, err = s.userRepo.GetByIDs(ctx, assignedIDs)
		if err != nil {
			return err
		}
	}
	status, err := taskdomain.ParseStatus(task.Status)
	if err != nil {
		return err
	}
	pid := projectID
	task.AssignedTo = users
	task.WorkspaceID = workspaceID
	task.ProjectID = &pid
	task.ID = uuid.New().String()
	task.Status = string(status)
	return s.taskRepo.Create(ctx, task)
}

func (s *TaskService) GetProjectTasks(ctx context.Context, projectID string) ([]*entity.Task, error) {
	return s.taskRepo.GetProjectTasks(ctx, projectID)
}

func (s *TaskService) GetTaskByID(ctx context.Context, taskID string) (*entity.Task, error) {
	return s.taskRepo.Get(ctx, taskID)
}

func (s *TaskService) Update(ctx context.Context, id string, data *entity.Task, assignedTo []string) (*entity.Task, error) {
	if data.Status != "" {
		status, err := taskdomain.ParseStatus(data.Status)
		if err != nil {
			return nil, err
		}
		data.Status = string(status)
	}
	return s.taskRepo.Update(ctx, id, data, assignedTo)
}

func (s *TaskService) GetWorkspaceTasks(ctx context.Context, workspaceID string) ([]*entity.Task, error) {
	tasks, err := s.taskRepo.GetWorkspaceTasks(ctx, workspaceID)
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

func (s *TaskService) UpdateTaskStatus(ctx context.Context, taskID, statusValue string) error {
	status, err := taskdomain.ParseStatus(statusValue)
	if err != nil {
		return err
	}
	return s.taskRepo.UpdateStatus(ctx, taskID, string(status))
}

func (s *TaskService) UpdateTaskAssignees(ctx context.Context, taskID string, assignedTo []string) error {
	return s.taskRepo.UpdateAssignees(ctx, taskID, assignedTo)
}

func (s *TaskService) Delete(ctx context.Context, id string) error {
	return s.taskRepo.Delete(ctx, id)
}

func (s *TaskService) GetFolderTasks(ctx context.Context, folderID string) ([]*entity.Task, error) {
	return s.taskRepo.GetFolderTasks(ctx, folderID)
}

func (s *TaskService) MoveTaskToFolder(ctx context.Context, taskID, folderID string) error {
	return s.taskRepo.MoveTaskToFolder(ctx, taskID, folderID)
}

func (s *TaskService) SearchInWorkspaces(ctx context.Context, workspaceIDs []string, query string) ([]*entity.Task, error) {
	return s.taskRepo.SearchInWorkspaces(ctx, workspaceIDs, query)
}
