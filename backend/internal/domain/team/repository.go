package team

import (
	"context"
	"os/user"
)

type Repository interface{
	CreateAndAddCreator(ctx context.Context, team *Team, userId string)error
	GetUsersInTeam(ctx context.Context, teamId string)([]*user.User,error)
}