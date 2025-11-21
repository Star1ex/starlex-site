package dto

import (
	"time"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
)

type TaskApi struct {
	AssignedToID []string `json:"user_id" binding:"required"`
	Task         string   `json:"task" binding:"required"`
	Description  string   `json:"description" binding:"required"`
	Priority 	 string   `json:"priority" binding:"required"`
}

type TaskResponse struct {
	ID          string
	Task        string
	Description string
	AssignedTo  []string
	TeamID      string
	Priority 	 string
	CreatedAt   time.Time
}

func ToTaskResponse(task *entity.Task) *TaskResponse {

	assignedIDs := make([]string, len(task.AssignedTo))
	for i, u := range task.AssignedTo {
		assignedIDs[i] = u.ID
	}

	return &TaskResponse{
		ID:          task.ID,
		Task:        task.Task,
		Description: task.Description,
		AssignedTo:  assignedIDs,
		TeamID:      task.TeamID,
		Priority: 	 task.Priority,
		CreatedAt:   task.CreatedAt,
	}
}

func TeamTasksList(tasks []*entity.Task) []TaskResponse {
	response := make([]TaskResponse, len(tasks))
	for i, task := range tasks {
		response[i] = *ToTaskResponse(task)
	}
	return response
}

func FromTaskApi(api *TaskApi) (*entity.Task, []string) {
	return &entity.Task{
		Task:        api.Task,
		Description: api.Description,
	}, api.AssignedToID
}
