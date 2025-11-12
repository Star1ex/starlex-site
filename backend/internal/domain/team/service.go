package team

import (
	"context"
)

type Service interface{
	CreateTeam(ctx context.Context,name,description,userID string)(*Team,error)
}