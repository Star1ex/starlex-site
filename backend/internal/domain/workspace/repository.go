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
	AddUserToWorkspace(ctx context.Context, workspaceID string, userID string) error
	RemoveUserFromWorkspace(ctx context.Context, workspaceID string, userID string) error
	UpdateName(ctx context.Context, workspaceID string, name string) error
	UpdateDescription(ctx context.Context, workspaceID string, description string) error
	UpdateIcon(ctx context.Context, workspaceID string, icon string) error
	Delete(ctx context.Context, workspaceID string) error
}
