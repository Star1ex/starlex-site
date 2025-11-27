package repository

import "errors"

// Errors for repository package(user)
var ErrAlreadyExists error = errors.New("repository: user already exists")
var ErrUserNotFound error = errors.New("repository: user not found")

// Errors for repository package(team)
var ErrTeamAlreadyExists error = errors.New("repository: team with this name already exists")
var ErrTeamNotFound error = errors.New("repository: team with this id not found")