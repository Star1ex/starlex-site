package task

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
)

type Repository interface {
	// CRUD
	Create(ctx context.Context, task *entity.Task) error
	Get(ctx context.Context, id string) (*entity.Task, error)
	Update(ctx context.Context, id string, data *entity.Task, assignedTo []string) (*entity.Task, error)
	UpdateTitle(ctx context.Context, id string, title string) error
	UpdateDescription(ctx context.Context, id string, description string) error
	UpdatePriority(ctx context.Context, id string, priority string) error
	UpdateProgress(ctx context.Context, id string, progress string) error
	UpdateAssignees(ctx context.Context, id string, assignedTo []string) error
	Delete(ctx context.Context, id string) error

	// Getters
	GetTeamTasks(ctx context.Context, teamID string) ([]*entity.Task, error)
	GetUserTasks(ctx context.Context, userID string) ([]*entity.Task, error)
	GetTasksWithoutFolder(ctx context.Context, userID string) ([]*entity.Task, error)
	GetFolderTasks(ctx context.Context, folderID string) ([]*entity.Task, error)

	MoveTaskToFolder(ctx context.Context, taskID, folderID string) error
}
