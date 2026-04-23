package repository

import "errors"

var (
	// User errors
	ErrUserAlreadyExists error = errors.New("repository: user already exists")
	ErrUserNotFound      error = errors.New("repository: user not found")

	// Team errors
	ErrTeamAlreadyExists error = errors.New("repository: team with this name already exists")
	ErrTeamNotFound      error = errors.New("repository: team with this id not found")

	// Team member errors
	ErrUserAlreadyInTeam error = errors.New("repository: user already in team")
)
