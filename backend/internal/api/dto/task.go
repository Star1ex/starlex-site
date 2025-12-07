package dto

import (
	"time"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
)

type TaskApi struct {
	AssignedToID []string `json:"user_id"` // Optional: can be empty array
	Task         string   `json:"task" binding:"required"`
	Description  string   `json:"description"`
	Progress     string   `json:"progress"`
	Priority     string   `json:"priority"`
}

type TaskResponse struct {
	ID          string    `json:"id" binding:"required"`
	Task        string    `json:"task" binding:"required"`
	Description string    `json:"description"`
	AssignedTo  []string  `json:"assignedTo"`
	TeamID      string    `json:"team_id"`
	Priority    string    `json:"priority"`
	Progress    string    `json:"progress"`
	CreatedAt   time.Time `json:"created_at,omitempty"`
}

func ToTaskResponse(task *entity.Task) *TaskResponse {
	assignedIDs := make([]string, len(task.AssignedTo))
	for i, u := range task.AssignedTo {
		assignedIDs[i] = u.ID
	}

	// Use zero time if CreatedAt is not set
	createdAt := task.CreatedAt
	if createdAt.IsZero() {
		createdAt = time.Time{} // Will be omitted in JSON due to omitempty
	}

	return &TaskResponse{
		ID:          task.ID,
		Task:        task.Task,
		Description: task.Description,
		AssignedTo:  assignedIDs,
		TeamID:      task.TeamID,
		Priority:    task.Priority,
		Progress:    task.Progress,
		CreatedAt:   createdAt,
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

type UpdateDto struct {
	AssignedToID *[]string `json:"user_id"`
	Task         *string   `json:"task"`
	Description  *string   `json:"description"`
	Progress     *string   `json:"progress"`
	Priority     *string   `json:"priority"`
}
