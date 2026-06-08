package entity

import (
	"time"

	domainlabel "github.com/Star1ex/starlex-site/internal/domain/label"
)

type Task struct {
	ID          string
	Key         string
	Task        string
	Description string
	Icon        string
	AssignedTo  []*User
	WorkspaceID string
	Status      string
	Priority    string
	Progress    string
	Labels      []*domainlabel.Label

	OwnerID   string
	FolderID  *string
	SprintID  *string
	ProjectID *string
	Position  int
	Subtasks  []*Subtask

	CreatedAt time.Time
	UpdatedAt time.Time
}

type UpdateTask struct {
	Task        string
	Description string
	AssignedTo  []User
	WorkspaceID string
	Status      string
	Priority    string
	Progress    string

	OwnerID   string
	FolderID  *string
	SprintID  *string
	Position  int
	CreatedAt time.Time
}

func NewTask(ID, task, description, priority, progress string, ownerID string, folderID *string, AssignedTo []*User) *Task {
	return &Task{
		ID:          ID,
		Task:        task,
		Description: description,
		AssignedTo:  AssignedTo,
		Progress:    progress,
		Priority:    priority,
		OwnerID:     ownerID,
		FolderID:    folderID,
	}
}
