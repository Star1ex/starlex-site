package project

import (
	"context"
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
)

// CreateInput carries the data required to create a project. Optional fields
// use zero values / nil. Status and Priority default when blank.
type CreateInput struct {
	Name        string
	Description string
	Goal        string
	Icon        string
	Priority    string
	Status      string
	LeaderID    string // defaults to the creator when blank
	Deadline    *time.Time
	MemberIDs   []string // additional members; creator is always added
}

// UpdateFields is a partial-update payload. Nil pointers mean "leave unchanged".
// Deadline uses a double pointer so the caller can distinguish "unchanged"
// (nil) from "clear the deadline" (non-nil pointer to a nil time).
type UpdateFields struct {
	Name        *string
	Description *string
	Goal        *string
	Icon        *string
	Priority    *string
	Status      *string
	LeaderID    *string
	Deadline    **time.Time
}

// Service defines project use cases. All mutating operations are guarded by
// project membership (any member may manage the project).
type Service interface {
	CreateProject(ctx context.Context, in CreateInput, userID string) (*entity.Project, error)
	GetProjectByID(ctx context.Context, projectID, userID string) (*entity.Project, error)
	GetUserProjects(ctx context.Context, userID string) ([]*entity.Project, error)
	UpdateProject(ctx context.Context, projectID string, fields UpdateFields, userID string) (*entity.Project, error)
	Delete(ctx context.Context, projectID, userID string) error

	GetMembers(ctx context.Context, projectID, userID string) ([]*entity.User, error)
	AddMember(ctx context.Context, projectID, email, requesterID string) error
	RemoveMember(ctx context.Context, projectID, userIDToRemove, requesterID string) error

	// EnsureMember returns nil when userID is a member of the project; used by
	// the API layer to authorise project-scoped task operations.
	EnsureMember(ctx context.Context, projectID, userID string) error
}
