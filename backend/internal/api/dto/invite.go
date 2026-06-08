package dto

import (
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	domaininvite "github.com/Star1ex/starlex-site/internal/domain/invite"
)

type CreateInviteRequest struct {
	Role           string `json:"role"`
	ExpiresInHours *int   `json:"expires_in_hours"`
	MaxUses        *int   `json:"max_uses"`
}

type CreateInviteResponse struct {
	Token string `json:"token"`
	URL   string `json:"url"`
}

type InviteWorkspacePreview struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Icon  string `json:"icon"`
	Color string `json:"color"`
}

type InvitePreviewResponse struct {
	Workspace *InviteWorkspacePreview `json:"workspace"`
	Valid     bool                    `json:"valid"`
}

type InviteResponse struct {
	ID          string     `json:"id"`
	WorkspaceID string     `json:"workspace_id"`
	Token       string     `json:"token"`
	Role        string     `json:"role"`
	CreatedBy   string     `json:"created_by"`
	ExpiresAt   *time.Time `json:"expires_at"`
	MaxUses     *int       `json:"max_uses"`
	UseCount    int        `json:"use_count"`
	RevokedAt   *time.Time `json:"revoked_at"`
	CreatedAt   time.Time  `json:"created_at"`
}

func ToInviteResponse(invite *domaininvite.Invite) InviteResponse {
	return InviteResponse{
		ID:          invite.ID,
		WorkspaceID: invite.WorkspaceID,
		Token:       invite.Token,
		Role:        invite.Role,
		CreatedBy:   invite.CreatedBy,
		ExpiresAt:   invite.ExpiresAt,
		MaxUses:     invite.MaxUses,
		UseCount:    invite.UseCount,
		RevokedAt:   invite.RevokedAt,
		CreatedAt:   invite.CreatedAt,
	}
}

func ToInviteResponses(invites []*domaininvite.Invite) []InviteResponse {
	response := make([]InviteResponse, len(invites))
	for i, invite := range invites {
		response[i] = ToInviteResponse(invite)
	}
	return response
}

func ToInviteWorkspacePreview(workspace *entity.Workspace) *InviteWorkspacePreview {
	if workspace == nil {
		return nil
	}
	return &InviteWorkspacePreview{
		ID:    workspace.ID,
		Name:  workspace.Name,
		Icon:  workspace.Icon,
		Color: workspace.Color,
	}
}
