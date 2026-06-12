package dto

import (
	"encoding/base64"
	"encoding/json"

	domaintask "github.com/Star1ex/starlex-site/internal/domain/task"
)

type TaskQueryCursor struct {
	Value string `json:"value"`
	ID    string `json:"id"`
}

type TaskQueryResponse struct {
	Tasks      []TaskResponse `json:"tasks"`
	NextCursor *string        `json:"next_cursor"`
	Limit      int            `json:"limit"`
	SortBy     string         `json:"sort_by"`
	Direction  string         `json:"direction"`
}

type TaskCategoryItemResponse struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Color string `json:"color,omitempty"`
	Count int    `json:"count"`
}

type TaskCategoryGroupResponse struct {
	Type  string                     `json:"type"`
	Items []TaskCategoryItemResponse `json:"items"`
}

type WorkspaceTaskCategoriesResponse struct {
	Categories []TaskCategoryGroupResponse `json:"categories"`
}

func ToTaskQueryResponse(result *domaintask.QueryResult, query domaintask.Query) TaskQueryResponse {
	var nextCursor *string
	if result.NextCursor != nil {
		encoded := EncodeTaskCursor(result.NextCursor)
		nextCursor = &encoded
	}
	return TaskQueryResponse{
		Tasks:      WorkspaceTasksList(result.Tasks),
		NextCursor: nextCursor,
		Limit:      query.Limit,
		SortBy:     string(query.SortBy),
		Direction:  string(query.Direction),
	}
}

func ToWorkspaceTaskCategoriesResponse(categories *domaintask.WorkspaceTaskCategories) WorkspaceTaskCategoriesResponse {
	return WorkspaceTaskCategoriesResponse{
		Categories: []TaskCategoryGroupResponse{
			{Type: "project", Items: toTaskCategoryItems(categories.Projects)},
			{Type: "status", Items: toTaskCategoryItems(categories.Statuses)},
			{Type: "priority", Items: toTaskCategoryItems(categories.Priorities)},
			{Type: "assignee", Items: toTaskCategoryItems(categories.Assignees)},
			{Type: "label", Items: toTaskCategoryItems(categories.Labels)},
			{Type: "due", Items: toTaskCategoryItems(categories.Due)},
		},
	}
}

func DecodeTaskCursor(value string) (*domaintask.QueryCursor, error) {
	if value == "" {
		return nil, nil
	}
	raw, err := base64.RawURLEncoding.DecodeString(value)
	if err != nil {
		return nil, err
	}
	var cursor TaskQueryCursor
	if err := json.Unmarshal(raw, &cursor); err != nil {
		return nil, err
	}
	return &domaintask.QueryCursor{Value: cursor.Value, ID: cursor.ID}, nil
}

func EncodeTaskCursor(cursor *domaintask.QueryCursor) string {
	raw, _ := json.Marshal(TaskQueryCursor{Value: cursor.Value, ID: cursor.ID})
	return base64.RawURLEncoding.EncodeToString(raw)
}

func toTaskCategoryItems(items []domaintask.CategoryItem) []TaskCategoryItemResponse {
	out := make([]TaskCategoryItemResponse, len(items))
	for i, item := range items {
		out[i] = TaskCategoryItemResponse{
			ID:    item.ID,
			Name:  item.Name,
			Color: item.Color,
			Count: item.Count,
		}
	}
	return out
}
