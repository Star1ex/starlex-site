package task

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
)

type Service interface{
	CreateTask(ctx context.Context, userId,task,description,teamID string)(*entity.Task,error)
	GetTeamTasks(ctx context.Context, teamID string)([]*entity.Task,error)
	GetUserTasks(ctx context.Context, userID string)([]*entity.Task,error)
}