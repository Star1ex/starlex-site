package project

import "errors"

var (
	// ErrProjectNotFound is returned when a project does not exist.
	ErrProjectNotFound = errors.New("project: not found")
	// ErrEmptyName is returned when a project name is missing or blank.
	ErrEmptyName = errors.New("project: name is required")
	// ErrInvalidStatus is returned when an unknown status is supplied.
	ErrInvalidStatus = errors.New("project: invalid status")
	// ErrInvalidPriority is returned when an unknown priority is supplied.
	ErrInvalidPriority = errors.New("project: invalid priority")
	// ErrNotMember is returned when the requester is not a member of the project.
	ErrNotMember = errors.New("project: requester is not a member of this project")
	// ErrAlreadyMember is returned when adding a user who is already a member.
	ErrAlreadyMember = errors.New("project: user already a member")
	// ErrCannotRemoveLeader is returned when attempting to remove the project leader.
	ErrCannotRemoveLeader = errors.New("project: cannot remove the project leader")
	// ErrLeaderNotMember is returned when a leader is set to a user who is not a member.
	ErrLeaderNotMember = errors.New("project: leader must be a member of the project")
)
