package project

import (
	"context"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
)

// Repository defines persistence operations for projects. It is implemented
// by the infrastructure layer (GORM) and depended upon by the service layer
// (Dependency Inversion).
type Repository interface {
	// CRUD
	Create(ctx context.Context, project *entity.Project) error
	GetByID(ctx context.Context, id string) (*entity.Project, error)
	Delete(ctx context.Context, id string) error

	// Field updates (partial) — apply only the provided fields.
	Update(ctx context.Context, id string, fields *UpdateFields) (*entity.Project, error)

	// Membership
	GetMembers(ctx context.Context, projectID string) ([]*entity.User, error)
	IsMember(ctx context.Context, projectID, userID string) (bool, error)
	AddMember(ctx context.Context, projectID, userID string) error
	RemoveMember(ctx context.Context, projectID, userID string) error

	// Listing — projects within a workspace that the user is a member of.
	GetWorkspaceProjects(ctx context.Context, workspaceID, userID string) ([]*entity.Project, error)
}
