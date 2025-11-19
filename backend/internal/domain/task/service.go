package task

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
)

type Service interface {

	// Create task
	CreateTask(ctx context.Context, teamID string, assignedIDs []string, task *entity.Task) error

	// Get all tasks from team by ID
	GetTeamTasks(ctx context.Context, teamID string) ([]*entity.Task, error)

	// Retrieves all tasks by ID
	GetUserTasks(ctx context.Context, userID string) ([]*entity.Task, error)
}
