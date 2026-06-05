package dto

import (
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	"github.com/Star1ex/starlex-site/internal/domain/project"
)

// CreateProjectRequest is the payload for creating a project within a workspace.
type CreateProjectRequest struct {
	Name        string     `json:"name"`
	Description string     `json:"description"`
	Goal        string     `json:"goal"`
	Icon        string     `json:"icon"`
	Priority    string     `json:"priority"`
	Status      string     `json:"status"`
	LeaderID    string     `json:"leader_id"`
	Deadline    *time.Time `json:"deadline"`
	MemberIDs   []string   `json:"member_ids"`
}

// UpdateProjectRequest is a partial-update payload. Omitted (nil) fields are
// left unchanged. Set clear_deadline=true to remove an existing deadline.
type UpdateProjectRequest struct {
	Name          *string    `json:"name"`
	Description   *string    `json:"description"`
	Goal          *string    `json:"goal"`
	Icon          *string    `json:"icon"`
	Priority      *string    `json:"priority"`
	Status        *string    `json:"status"`
	LeaderID      *string    `json:"leader_id"`
	Deadline      *time.Time `json:"deadline"`
	ClearDeadline bool       `json:"clear_deadline"`
}

type ProjectResponse struct {
	ID          string     `json:"id"`
	WorkspaceID string     `json:"workspace_id"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	Goal        string     `json:"goal"`
	Icon        string     `json:"icon"`
	Priority    string     `json:"priority"`
	Status      string     `json:"status"`
	LeaderID    string     `json:"leader_id"`
	CreatedBy   string     `json:"created_by"`
	Deadline    *time.Time `json:"deadline,omitempty"`
	MemberIDs   []string   `json:"member_ids"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type AddProjectMemberRequest struct {
	Email string `json:"email"`
}

type RemoveProjectMemberRequest struct {
	UserID string `json:"user_id"`
}

func (r *CreateProjectRequest) ToCreateInput() project.CreateInput {
	return project.CreateInput{
		Name:        r.Name,
		Description: r.Description,
		Goal:        r.Goal,
		Icon:        r.Icon,
		Priority:    r.Priority,
		Status:      r.Status,
		LeaderID:    r.LeaderID,
		Deadline:    r.Deadline,
		MemberIDs:   r.MemberIDs,
	}
}

func (r *UpdateProjectRequest) ToUpdateFields() project.UpdateFields {
	fields := project.UpdateFields{
		Name:        r.Name,
		Description: r.Description,
		Goal:        r.Goal,
		Icon:        r.Icon,
		Priority:    r.Priority,
		Status:      r.Status,
		LeaderID:    r.LeaderID,
	}
	switch {
	case r.ClearDeadline:
		var none *time.Time
		fields.Deadline = &none
	case r.Deadline != nil:
		d := r.Deadline
		fields.Deadline = &d
	}
	return fields
}

func ToProjectResponse(p *entity.Project) *ProjectResponse {
	memberIDs := make([]string, len(p.Members))
	for i, m := range p.Members {
		memberIDs[i] = m.ID
	}
	return &ProjectResponse{
		ID:          p.ID,
		WorkspaceID: p.WorkspaceID,
		Name:        p.Name,
		Description: p.Description,
		Goal:        p.Goal,
		Icon:        p.Icon,
		Priority:    p.Priority,
		Status:      p.Status,
		LeaderID:    p.LeaderID,
		CreatedBy:   p.CreatedBy,
		Deadline:    p.Deadline,
		MemberIDs:   memberIDs,
		CreatedAt:   p.CreatedAt,
		UpdatedAt:   p.UpdatedAt,
	}
}

func ToProjectsResponse(projects []*entity.Project) []ProjectResponse {
	response := make([]ProjectResponse, len(projects))
	for i, p := range projects {
		response[i] = *ToProjectResponse(p)
	}
	return response
}
