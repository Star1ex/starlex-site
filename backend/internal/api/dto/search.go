package dto

import "github.com/Star1ex/starlex-site/internal/domain/entity"

type SearchTeamResult struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type SearchSprintResult struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	TeamID string `json:"team_id"`
	Status string `json:"status"`
}

type SearchTaskResult struct {
	ID       string  `json:"id"`
	Task     string  `json:"task"`
	TeamID   string  `json:"team_id"`
	SprintID *string `json:"sprint_id"`
	Progress string  `json:"progress"`
	Priority string  `json:"priority"`
}

type GlobalSearchResponse struct {
	Teams   []SearchTeamResult   `json:"teams"`
	Sprints []SearchSprintResult `json:"sprints"`
	Tasks   []SearchTaskResult   `json:"tasks"`
}

func ToSearchTeamResult(t *entity.Team) SearchTeamResult {
	return SearchTeamResult{ID: t.ID, Name: t.Name}
}

func ToSearchSprintResult(s *entity.Sprint) SearchSprintResult {
	return SearchSprintResult{ID: s.ID, Name: s.Name, TeamID: s.TeamID, Status: s.Status}
}

func ToSearchTaskResult(t *entity.Task) SearchTaskResult {
	return SearchTaskResult{
		ID:       t.ID,
		Task:     t.Task,
		TeamID:   t.TeamID,
		SprintID: t.SprintID,
		Progress: t.Progress,
		Priority: t.Priority,
	}
}
