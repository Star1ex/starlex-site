package task

import (
	"context"
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
)

type Repository interface {
	// CRUD
	Create(ctx context.Context, task *entity.Task) error
	Get(ctx context.Context, id string) (*entity.Task, error)
	Update(ctx context.Context, id string, data *entity.Task, assignedTo []string) (*entity.Task, error)
	UpdateIcon(ctx context.Context, id string, icon string) error
	UpdateTitle(ctx context.Context, id string, title string) error
	UpdateDescription(ctx context.Context, id string, description string) error
	UpdatePriority(ctx context.Context, id string, priority string) error
	UpdateProgress(ctx context.Context, id string, progress string) error
	UpdateStatus(ctx context.Context, id string, status string) error
	UpdateDueDate(ctx context.Context, id string, dueDate *time.Time) error
	UpdateAssignees(ctx context.Context, id string, assignedTo []string) error
	UpdateLabels(ctx context.Context, id string, labelIDs []string) error
	Delete(ctx context.Context, id string) error

	// Getters
	GetWorkspaceTasks(ctx context.Context, workspaceID string) ([]*entity.Task, error)
	GetProjectTasks(ctx context.Context, projectID string) ([]*entity.Task, error)
	QueryWorkspaceTasks(ctx context.Context, query Query) (*QueryResult, error)
	GetWorkspaceTaskCategories(ctx context.Context, workspaceID string) (*WorkspaceTaskCategories, error)

	SearchInWorkspaces(ctx context.Context, workspaceIDs []string, query string) ([]*entity.Task, error)
}
