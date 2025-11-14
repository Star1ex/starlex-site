package team

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
)

type Repository interface{
	CreateAndAddCreator(ctx context.Context, team *entity.Team, userId string)error
	GetUsersInTeam(ctx context.Context, teamId string)([]*entity.User,error)
}