package dto

import (
	"time"

	domainlabel "github.com/Star1ex/starlex-site/internal/domain/label"
)

type CreateLabelRequest struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}

type UpdateLabelRequest struct {
	Name  *string `json:"name"`
	Color *string `json:"color"`
}

type UpdateTaskLabelsRequest struct {
	LabelIDs []string `json:"label_ids"`
}

type LabelResponse struct {
	ID          string    `json:"id"`
	WorkspaceID string    `json:"workspace_id"`
	Name        string    `json:"name"`
	Color       string    `json:"color"`
	CreatedAt   time.Time `json:"created_at,omitempty"`
	UpdatedAt   time.Time `json:"updated_at,omitempty"`
}

func ToLabelResponse(label *domainlabel.Label) LabelResponse {
	return LabelResponse{
		ID:          label.ID,
		WorkspaceID: label.WorkspaceID,
		Name:        label.Name,
		Color:       label.Color,
		CreatedAt:   label.CreatedAt,
		UpdatedAt:   label.UpdatedAt,
	}
}

func ToLabelResponses(labels []*domainlabel.Label) []LabelResponse {
	response := make([]LabelResponse, len(labels))
	for i, label := range labels {
		response[i] = ToLabelResponse(label)
	}
	return response
}
