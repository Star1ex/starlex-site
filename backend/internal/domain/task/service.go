package task

import "context"

type Service interface{
	CreateTask(ctx context.Context, userId,task,description,teamID string)error
}