package repository

import "errors"

var (
	// User errors
	ErrUserAlreadyExists error = errors.New("repository: user already exists")
	ErrUserNotFound      error = errors.New("repository: user not found")

	// Workspace errors
	ErrWorkspaceAlreadyExists error = errors.New("repository: workspace with this name already exists")
	ErrWorkspaceNotFound      error = errors.New("repository: workspace with this id not found")

	// Workspace member errors
	ErrUserAlreadyInWorkspace error = errors.New("repository: user already in workspace")
)
