package team

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
)

type Service interface{
	CreateTeam(ctx context.Context,name,description,userID string)(*entity.Team,error)
	GetUsers(ctx context.Context,teamId string)([]*entity.User,error)
}