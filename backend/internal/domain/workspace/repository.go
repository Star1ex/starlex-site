package workspace

import (
	"context"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
)

// Intarfaces for repository Workspace
// Have full CRUD operations

type Repository interface {
	// CRUD
	CreateAndAddCreator(ctx context.Context, workspace *entity.Workspace, email string) error
	GetWorkspace(ctx context.Context, workspaceID string) ([]*entity.User, error)
	GetWorkspaceByID(ctx context.Context, workspaceID string) (*entity.Workspace, error)
	ListMembers(ctx context.Context, workspaceID string) ([]*Member, error)
	GetRole(ctx context.Context, workspaceID, userID string) (Role, error)
	CountOwners(ctx context.Context, workspaceID string) (int64, error)
	CountMembers(ctx context.Context, workspaceID string) (int64, error)
	CountProjects(ctx context.Context, workspaceID string) (int64, error)
	AddUserToWorkspace(ctx context.Context, workspaceID string, userID string) error
	AddMember(ctx context.Context, workspaceID, userID string, role Role) error
	UpdateMemberRole(ctx context.Context, workspaceID, userID string, role Role) error
	RemoveUserFromWorkspace(ctx context.Context, workspaceID string, userID string) error
	UpdateName(ctx context.Context, workspaceID string, name string) error
	UpdateDescription(ctx context.Context, workspaceID string, description string) error
	UpdateIcon(ctx context.Context, workspaceID string, icon string) error
	UpdateColor(ctx context.Context, workspaceID string, color string) error
	UpdateSettings(ctx context.Context, workspaceID string, settings SettingsUpdate) (*entity.Workspace, error)
	Delete(ctx context.Context, workspaceID string) error
}
