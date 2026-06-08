package workspace

import (
	"context"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
)

type Service interface {

	// Create workspace
	CreateWorkspace(ctx context.Context, name, description, userID string) (*entity.Workspace, error)
	Delete(ctx context.Context, workspaceID, userID string) error
	UpdateWorkspaceName(ctx context.Context, workspaceID, name, userID string) error
	UpdateWorkspaceDescription(ctx context.Context, workspaceID, description, userID string) error
	UpdateWorkspaceIcon(ctx context.Context, workspaceID, icon, userID string) error
	// Retrieves all users from workspace
	GetUsers(ctx context.Context, workspaceId string) ([]*entity.User, error)
	ListMembers(ctx context.Context, workspaceID string) ([]*Member, error)
	GetRole(ctx context.Context, workspaceID, userID string) (Role, error)
	AddUserToWorkspace(ctx context.Context, workspaceID string, email string, requesterID string) error
	AddMember(ctx context.Context, workspaceID, email, role, requesterID string) error
	UpdateMemberRole(ctx context.Context, workspaceID, userID, role, requesterID string) error
	RemoveUserFromWorkspace(ctx context.Context, workspaceID, userIDToRemove, currentUserID string) error
	GetWorkspaceByID(ctx context.Context, workspaceID string) (*entity.Workspace, error)
}
