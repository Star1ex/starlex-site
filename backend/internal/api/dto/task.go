package dto

import (
	"time"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
)

type TaskApi struct{
	AssignedToID string `json:"user_id" binding:"required"`
	Task string `json:"task" binding:"required"`
	Description string `json:"description" binding:"required"`
}

type TaskResponse struct{
	ID          string
	Task        string
	Description string
	AssignedTo  string
	TeamID 		string
	CreatedAt   time.Time
}

func ToTaskResponse(task *entity.Task)*TaskResponse{
	return &TaskResponse{
		ID: task.ID,
		Task: task.Task,     
    	Description: task.Description,
    	AssignedTo:task.AssignedTo,
   	 	TeamID:task.TeamID,    
    	CreatedAt:task.CreatedAt,
	}
}
func TeamTasksList(tasks []*entity.Task)[]TaskResponse{
	response := make([]TaskResponse,len(tasks))
	for i,task := range tasks{
		response[i]=*ToTaskResponse(task)
	}
	return response
}


