package dto

import (
	"github.com/Star1ex/starlex-site/internal/domain/entity"
)

type WorkspaceApi struct {
	UserID      string `json:"user_id" binding:"required"`
	Name        string `json:"name" binding:"required"`
	Description string `json:"description" binding:"required"`
}

type WorkspaceResponse struct {
	WorkspaceID string `json:"workspace_id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
}

type UpdateWorkspaceIcon struct {
	Icon *string `json:"icon"`
}

func ToWorkspaceResponse(workspace *entity.Workspace) *WorkspaceResponse {
	return &WorkspaceResponse{
		WorkspaceID: workspace.ID,
		Name:        workspace.Name,
		Description: workspace.Description,
		Icon:        workspace.Icon,
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

func ToWorkspacesResponse(workspaces []*entity.Workspace) []WorkspaceResponse {
	response := make([]WorkspaceResponse, len(workspaces))
	for i, workspace := range workspaces {
		response[i] = WorkspaceResponse{
			WorkspaceID: workspace.ID,
			Name:        workspace.Name,
			Description: workspace.Description,
			Icon:        workspace.Icon,
		}
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
