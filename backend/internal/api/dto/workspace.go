package dto

import (
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	domainworkspace "github.com/Star1ex/starlex-site/internal/domain/workspace"
)

type WorkspaceApi struct {
	UserID      string `json:"user_id" binding:"required"`
	Name        string `json:"name" binding:"required"`
	Description string `json:"description" binding:"required"`
}

type WorkspaceResponse struct {
	WorkspaceID       string `json:"workspace_id"`
	ID                string `json:"id"`
	Name              string `json:"name"`
	Description       string `json:"description"`
	Icon              string `json:"icon"`
	Color             string `json:"color"`
	KeyPrefix         string `json:"key_prefix"`
	DefaultTaskStatus string `json:"default_task_status"`
	MemberDefaultRole string `json:"member_default_role"`
	Role              string `json:"role"`
	MemberCount       int    `json:"member_count"`
	ProjectCount      int    `json:"project_count"`
}

type UpdateWorkspaceIcon struct {
	Icon *string `json:"icon"`
}

type UpdateWorkspaceColor struct {
	Color *string `json:"color"`
}

type PatchWorkspaceSettingsRequest struct {
	Name              *string `json:"name"`
	Description       *string `json:"description"`
	Icon              *string `json:"icon"`
	Color             *string `json:"color"`
	KeyPrefix         *string `json:"key_prefix"`
	DefaultTaskStatus *string `json:"default_task_status"`
	MemberDefaultRole *string `json:"member_default_role"`
}

func FromPatchWorkspaceSettingsRequest(req PatchWorkspaceSettingsRequest) domainworkspace.SettingsUpdate {
	return domainworkspace.SettingsUpdate{
		Name:              req.Name,
		Description:       req.Description,
		Icon:              req.Icon,
		Color:             req.Color,
		KeyPrefix:         req.KeyPrefix,
		DefaultTaskStatus: req.DefaultTaskStatus,
		MemberDefaultRole: req.MemberDefaultRole,
	}
}

func ToWorkspaceResponse(workspace *entity.Workspace) *WorkspaceResponse {
	return &WorkspaceResponse{
		WorkspaceID:       workspace.ID,
		ID:                workspace.ID,
		Name:              workspace.Name,
		Description:       workspace.Description,
		Icon:              workspace.Icon,
		Color:             workspace.Color,
		KeyPrefix:         workspace.KeyPrefix,
		DefaultTaskStatus: workspace.DefaultTaskStatus,
		MemberDefaultRole: workspace.MemberDefaultRole,
		Role:              workspace.Role,
		MemberCount:       workspace.MemberCount,
		ProjectCount:      workspace.ProjectCount,
	}
}

type RemoveUserFromWorkspaceRequest struct {
	UserID string `json:"userId" validate:"required"`
}

type DeleteWorkspace struct {
	WorkspaceID string `json:"workspace_id" binding:"required"`
}

type UpdateWorkspaceName struct {
	Name *string `json:"name"`
}

type UpdateWorkspaceDescription struct {
	Description *string `json:"description"`
}

type WorkspaceMemberResponse struct {
	User     UserResponse `json:"user"`
	Role     string       `json:"role"`
	JoinedAt time.Time    `json:"joined_at"`
}

type AddWorkspaceMemberRequest struct {
	Email string `json:"email"`
	Role  string `json:"role"`
}

type UpdateWorkspaceMemberRoleRequest struct {
	Role string `json:"role"`
}

func ToWorkspacesResponse(workspaces []*entity.Workspace) []WorkspaceResponse {
	response := make([]WorkspaceResponse, len(workspaces))
	for i, workspace := range workspaces {
		response[i] = WorkspaceResponse{
			WorkspaceID:       workspace.ID,
			ID:                workspace.ID,
			Name:              workspace.Name,
			Description:       workspace.Description,
			Icon:              workspace.Icon,
			Color:             workspace.Color,
			KeyPrefix:         workspace.KeyPrefix,
			DefaultTaskStatus: workspace.DefaultTaskStatus,
			MemberDefaultRole: workspace.MemberDefaultRole,
			Role:              workspace.Role,
			MemberCount:       workspace.MemberCount,
			ProjectCount:      workspace.ProjectCount,
		}
	}
	return response
}

func ToWorkspaceMemberResponse(member *domainworkspace.Member) WorkspaceMemberResponse {
	userResponse := ToUserResponse(member.User)
	return WorkspaceMemberResponse{
		User:     *userResponse,
		Role:     string(member.Role),
		JoinedAt: member.JoinedAt,
	}
}

func ToWorkspaceMemberResponses(members []*domainworkspace.Member) []WorkspaceMemberResponse {
	response := make([]WorkspaceMemberResponse, len(members))
	for i, member := range members {
		response[i] = ToWorkspaceMemberResponse(member)
	}
	return response
}

func ToUsersResponse(users []*entity.User) []UserResponse {
	response := make([]UserResponse, len(users))
	for i, user := range users {
		response[i] = *ToUserResponse(user)
	}
	return response
}
