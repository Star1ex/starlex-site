package dto

import "github.com/Star1ex/starlex-site/internal/domain/entity"

type SearchWorkspaceResult struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type SearchSprintResult struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	WorkspaceID string `json:"workspace_id"`
	Status      string `json:"status"`
}

type SearchTaskResult struct {
	ID          string  `json:"id"`
	Task        string  `json:"task"`
	WorkspaceID string  `json:"workspace_id"`
	SprintID    *string `json:"sprint_id"`
	Progress    string  `json:"progress"`
	Priority    string  `json:"priority"`
}

type GlobalSearchResponse struct {
	Workspaces []SearchWorkspaceResult `json:"workspaces"`
	Sprints    []SearchSprintResult    `json:"sprints"`
	Tasks      []SearchTaskResult      `json:"tasks"`
}

func ToSearchWorkspaceResult(t *entity.Workspace) SearchWorkspaceResult {
	return SearchWorkspaceResult{ID: t.ID, Name: t.Name}
}

func ToSearchSprintResult(s *entity.Sprint) SearchSprintResult {
	return SearchSprintResult{ID: s.ID, Name: s.Name, WorkspaceID: s.WorkspaceID, Status: s.Status}
}

func ToSearchTaskResult(t *entity.Task) SearchTaskResult {
	return SearchTaskResult{
		ID:          t.ID,
		Task:        t.Task,
		WorkspaceID: t.WorkspaceID,
		SprintID:    t.SprintID,
		Progress:    t.Progress,
		Priority:    t.Priority,
	}
}
