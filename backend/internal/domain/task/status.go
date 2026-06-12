package task

import "errors"

type Status string

const (
	StatusBacklog    Status = "backlog"
	StatusTodo       Status = "todo"
	StatusInProgress Status = "in_progress"
	StatusInReview   Status = "in_review"
	StatusDone       Status = "done"
	StatusCanceled   Status = "canceled"
)

var ErrInvalidStatus = errors.New("task: invalid status")

func ParseStatus(value string) (Status, error) {
	status := Status(value)
	if status == "" {
		return StatusTodo, nil
	}
	if !status.Valid() {
		return "", ErrInvalidStatus
	}
	return status, nil
}

func (s Status) Valid() bool {
	switch s {
	case StatusBacklog, StatusTodo, StatusInProgress, StatusInReview, StatusDone, StatusCanceled:
		return true
	default:
		return false
	}
}
