package label

import (
	"errors"
	"time"
)

var (
	ErrLabelNotFound = errors.New("label: not found")
	ErrInvalidName   = errors.New("label: invalid name")
	ErrInvalidColor  = errors.New("label: invalid color")
)

type Label struct {
	ID          string
	WorkspaceID string
	Name        string
	Color       string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
