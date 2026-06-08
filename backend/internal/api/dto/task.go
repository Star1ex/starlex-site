package dto

import (
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
)

type TaskApi struct {
	AssignedToID []string   `json:"user_ids"` // Optional: can be empty array
	Task         string     `json:"task" binding:"required"`
	Description  string     `json:"description"`
	Status       string     `json:"status"`
	Progress     string     `json:"progress"`
	DueDate      *time.Time `json:"due_date"`
	Priority     string     `json:"priority"`
	FolderID     *string    `json:"folder_id"`
	WorkspaceID  *string    `json:"workspace_id"`
	ProjectID    *string    `json:"project_id"`
	OwnerID      string     `json:"owner_id"`
	CreatedAt    time.Time  `json:"created_at"`
}

type TaskResponse struct {
	ID          string            `json:"id" binding:"required"`
	Key         string            `json:"key"`
	Task        string            `json:"task" binding:"required"`
	Description string            `json:"description"`
	Icon        string            `json:"icon"`
	AssignedTo  []string          `json:"user_ids"`
	WorkspaceID string            `json:"workspace_id"`
	FolderID    *string           `json:"folder_id"`
	ProjectID   *string           `json:"project_id"`
	OwnerID     string            `json:"owner_id"`
	Status      string            `json:"status"`
	Priority    string            `json:"priority"`
	Progress    string            `json:"progress"`
	DueDate     *time.Time        `json:"due_date"`
	Labels      []LabelResponse   `json:"labels"`
	Subtasks    []SubtaskResponse `json:"subtasks"`
	CreatedAt   time.Time         `json:"created_at,omitempty"`
	UpdatedAt   time.Time         `json:"updated_at,omitempty"`
}

type UpdateTaskIcon struct {
	Icon *string `json:"icon"`
}

type UpdateTask struct {
	Task        string    `json:"task"`
	Description string    `json:"description"`
	AssignedTo  []string  `json:"user_ids"`
	Status      string    `json:"status"`
	Priority    string    `json:"priority"`
	FolderID    *string   `json:"folder_id"`
	OwnerID     string    `json:"owner_id"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type UpdateTaskTitle struct {
	Task *string `json:"task"`
}

type UpdateTaskDescription struct {
	Description *string `json:"description"`
}

type UpdateTaskPriority struct {
	Priority *string `json:"priority"`
}

type UpdateTaskProgress struct {
	Progress *string `json:"progress"`
}

type UpdateTaskStatus struct {
	Status *string `json:"status"`
}

type UpdateTaskDueDate struct {
	DueDate *time.Time `json:"due_date"`
}

type UpdateTaskAssignees struct {
	UserIDs *[]string `json:"user_ids"`
}

func ToTaskResponse(task *entity.Task) *TaskResponse {
	assignedIDs := make([]string, len(task.AssignedTo))
	for i, u := range task.AssignedTo {
		assignedIDs[i] = u.ID
	}

	subtasks := make([]SubtaskResponse, len(task.Subtasks))
	for i, s := range task.Subtasks {
		subtasks[i] = toSubtaskResponse(s)
	}
	labels := ToLabelResponses(task.Labels)

	// Use zero time if CreatedAt is not set
	createdAt := task.CreatedAt
	if createdAt.IsZero() {
		createdAt = time.Time{} // Will be omitted in JSON due to omitempty
	}

	return &TaskResponse{
		ID:          task.ID,
		Key:         task.Key,
		Task:        task.Task,
		Description: task.Description,
		Icon:        task.Icon,
		AssignedTo:  assignedIDs,
		WorkspaceID: task.WorkspaceID,
		FolderID:    task.FolderID,
		ProjectID:   task.ProjectID,
		OwnerID:     task.OwnerID,
		Status:      task.Status,
		Priority:    task.Priority,
		Progress:    task.Progress,
		DueDate:     task.DueDate,
		Labels:      labels,
		Subtasks:    subtasks,
		CreatedAt:   createdAt,
		UpdatedAt:   task.UpdatedAt,
	}
}

func WorkspaceTasksList(tasks []*entity.Task) []TaskResponse {
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
		Status:      api.Status,
		Priority:    api.Priority,
		Progress:    api.Progress,
		DueDate:     api.DueDate,
	}, api.AssignedToID
}

func FromUpdateTask(updates *UpdateTask) (*entity.Task, []string) {
	return &entity.Task{
		Task:        updates.Task,
		Description: updates.Description,
		Status:      updates.Status,
		Priority:    updates.Priority,
		UpdatedAt:   updates.UpdatedAt,
	}, updates.AssignedTo
}

type UpdateDto struct {
	AssignedToID *[]string `json:"user_id"`
	Task         *string   `json:"task"`
	Description  *string   `json:"description"`
	FolderID     *string   `json:"folder_id"`
	WorkspaceID  *string   `json:"workspace_id"`
	OwnerID      *string   `json:"owner_id"`
	Progress     *string   `json:"progress"`
	Status       *string   `json:"status"`
	Priority     *string   `json:"priority"`
}
