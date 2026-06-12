package entity

import "time"

// Project is a standalone grouping of tasks (Linear-style project).
// It has its own member list; access to a project's tasks is granted by
// membership. A project is owned by its creator and led by a leader, but any
// member may manage settings and membership.
type Project struct {
	ID          string
	WorkspaceID string // the workspace this project belongs to
	Name        string
	Description string
	Goal        string
	Icon        string // logo / emoji / asset key
	Priority    string // see domain/project.Priority
	Status      string // see domain/project.Status
	LeaderID    string
	CreatedBy   string
	Deadline    *time.Time // optional
	Members     []*User
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// NewProject builds a Project with the required fields. Optional fields
// (deadline, members) are set by the caller. ID is assigned by the service.
func NewProject(id, workspaceID, name, description, goal, icon, priority, status, leaderID, createdBy string, deadline *time.Time) *Project {
	return &Project{
		ID:          id,
		WorkspaceID: workspaceID,
		Name:        name,
		Description: description,
		Goal:        goal,
		Icon:        icon,
		Priority:    priority,
		Status:      status,
		LeaderID:    leaderID,
		CreatedBy:   createdBy,
		Deadline:    deadline,
	}
}
