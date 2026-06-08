package dto

import (
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
)

type SubtaskResponse struct {
	ID        string    `json:"id"`
	TaskID    string    `json:"task_id"`
	Title     string    `json:"title"`
	IsDone    bool      `json:"is_done"`
	Position  int       `json:"position"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type SprintTaskUserResponse struct {
	ID        string  `json:"id"`
	Email     string  `json:"email"`
	FirstName string  `json:"firstName"`
	LastName  string  `json:"lastName"`
	Role      string  `json:"role"`
	PhotoURL  *string `json:"photo_url"`
	AvatarURL *string `json:"avatar_url"`
}

type SprintTaskResponse struct {
	ID          string            `json:"id"`
	Key         string            `json:"key"`
	Task        string            `json:"task"`
	Description string            `json:"description"`
	Assignees   []UserResponse    `json:"assignees"`
	WorkspaceID string            `json:"workspace_id"`
	FolderID    *string           `json:"folder_id"`
	ProjectID   *string           `json:"project_id"`
	OwnerID     string            `json:"owner_id"`
	Status      string            `json:"status"`
	Priority    string            `json:"priority"`
	Progress    string            `json:"progress"`
	DueDate     *time.Time        `json:"due_date"`
	Labels      []LabelResponse   `json:"labels"`
	SprintID    *string           `json:"sprint_id"`
	Position    int               `json:"position"`
	Subtasks    []SubtaskResponse `json:"subtasks"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
}

type SprintResponse struct {
	ID          string               `json:"id"`
	Name        string               `json:"name"`
	Goal        string               `json:"goal"`
	WorkspaceID string               `json:"workspace_id"`
	Status      string               `json:"status"`
	StartDate   *time.Time           `json:"start_date"`
	EndDate     *time.Time           `json:"end_date"`
	CreatedBy   string               `json:"created_by"`
	CreatedAt   time.Time            `json:"created_at"`
	UpdatedAt   time.Time            `json:"updated_at"`
	Tasks       []SprintTaskResponse `json:"tasks"`
}

func toSubtaskResponse(s *entity.Subtask) SubtaskResponse {
	return SubtaskResponse{
		ID:        s.ID,
		TaskID:    s.TaskID,
		Title:     s.Title,
		IsDone:    s.IsDone,
		Position:  s.Position,
		CreatedAt: s.CreatedAt,
		UpdatedAt: s.UpdatedAt,
	}
}

func toSprintTaskUserResponse(u *entity.User) SprintTaskUserResponse {
	return SprintTaskUserResponse{
		ID:        u.ID,
		Email:     u.Email,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		Role:      u.Role,
		PhotoURL:  u.Photo_URL,
		AvatarURL: u.AvatarURL,
	}
}

func toSprintTaskResponse(t *entity.Task) SprintTaskResponse {
	users := make([]UserResponse, len(t.AssignedTo))
	for i, u := range t.AssignedTo {
		users[i] = *ToUserResponse(u)
	}
	subtasks := make([]SubtaskResponse, len(t.Subtasks))
	for i, s := range t.Subtasks {
		subtasks[i] = toSubtaskResponse(s)
	}
	return SprintTaskResponse{
		ID:          t.ID,
		Key:         t.Key,
		Task:        t.Task,
		Description: t.Description,
		Assignees:   users,
		WorkspaceID: t.WorkspaceID,
		FolderID:    t.FolderID,
		ProjectID:   t.ProjectID,
		OwnerID:     t.OwnerID,
		Status:      t.Status,
		Priority:    t.Priority,
		Progress:    t.Progress,
		DueDate:     t.DueDate,
		Labels:      ToLabelResponses(t.Labels),
		SprintID:    t.SprintID,
		Position:    t.Position,
		Subtasks:    subtasks,
		CreatedAt:   t.CreatedAt,
		UpdatedAt:   t.UpdatedAt,
	}
}

func ToSprintResponse(sprint *entity.Sprint) *SprintResponse {
	tasks := make([]SprintTaskResponse, len(sprint.Tasks))
	for i, t := range sprint.Tasks {
		tasks[i] = toSprintTaskResponse(t)
	}
	return &SprintResponse{
		ID:          sprint.ID,
		Name:        sprint.Name,
		Goal:        sprint.Goal,
		WorkspaceID: sprint.WorkspaceID,
		Status:      sprint.Status,
		StartDate:   sprint.StartDate,
		EndDate:     sprint.EndDate,
		CreatedBy:   sprint.CreatedBy,
		CreatedAt:   sprint.CreatedAt,
		UpdatedAt:   sprint.UpdatedAt,
		Tasks:       tasks,
	}
}

func ToSprintListResponse(sprints []*entity.Sprint) []SprintResponse {
	result := make([]SprintResponse, len(sprints))
	for i, s := range sprints {
		result[i] = *ToSprintResponse(s)
	}
	return result
}

func ToSubtaskResponse(s *entity.Subtask) *SubtaskResponse {
	r := toSubtaskResponse(s)
	return &r
}
