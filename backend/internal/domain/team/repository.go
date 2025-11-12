package team

import (
	"context"
)

type Repository interface{
	CreateAndAddCreator(ctx context.Context, team *Team, userId string)error
}