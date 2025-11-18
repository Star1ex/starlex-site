package task

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
)

type Repository interface {
	// CRUD
	Create(ctx context.Context, task *entity.Task) error
	Get(ctx context.Context, id string) (*entity.Task, error)
	Update(ctx context.Context, id string, updateTask *entity.UpdateTask) error
	Delete(ctx context.Context, id string) error

	// Getters
	GetTeamTasks(ctx context.Context, teamID string) ([]*entity.Task, error)
	GetUserTasks(ctx context.Context, userID string) ([]*entity.Task, error)
}
