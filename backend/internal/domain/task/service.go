package task

import (
	"context"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
)

type Service interface {

	// Create task
	CreateWorkspaceTask(ctx context.Context, workspaceID string, assignedIDs []string, task *entity.Task, userId string) error
	CreateProjectTask(ctx context.Context, projectID, workspaceID string, assignedIDs []string, task *entity.Task) error

	// Get task by ID
	GetTaskByID(ctx context.Context, taskID string) (*entity.Task, error)
	// Get all tasks from workspace by ID
	GetWorkspaceTasks(ctx context.Context, workspaceID string) ([]*entity.Task, error)
	// Get tasks from folder
	GetFolderTasks(ctx context.Context, folderID string) ([]*entity.Task, error)
	// Get tasks from project
	GetProjectTasks(ctx context.Context, projectID string) ([]*entity.Task, error)

	Update(ctx context.Context, id string, data *entity.Task, assignedTo []string) (*entity.Task, error)
	// Update task
	UpdateTaskProgress(ctx context.Context, taskID, progress string) (*entity.Task, error)
	UpdateTaskIcon(ctx context.Context, taskID, icon string) error
	UpdateTaskTitle(ctx context.Context, taskID, title string) error
	UpdateTaskDescription(ctx context.Context, taskID, description string) error
	UpdateTaskPriority(ctx context.Context, taskID, priority string) error
	UpdateTaskStatus(ctx context.Context, taskID, progress string) error
	UpdateTaskAssignees(ctx context.Context, taskID string, assignedTo []string) error
	// Delete task
	Delete(ctx context.Context, id string) error

	// Move task to folder
	MoveTaskToFolder(ctx context.Context, taskID, folderID string) error

	// Search tasks across multiple workspaces
	SearchInWorkspaces(ctx context.Context, workspaceIDs []string, query string) ([]*entity.Task, error)
}
