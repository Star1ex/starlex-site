package project

// Status is a value object describing the lifecycle stage of a project,
// modelled after Linear project statuses.
type Status string

const (
	StatusBacklog    Status = "backlog"
	StatusPlanned    Status = "planned"
	StatusInProgress Status = "in_progress"
	StatusPaused     Status = "paused"
	StatusCompleted  Status = "completed"
	StatusCancelled  Status = "cancelled"
)

// DefaultStatus is applied when a project is created without an explicit status.
const DefaultStatus = StatusBacklog

// Valid reports whether s is a known project status.
func (s Status) Valid() bool {
	switch s {
	case StatusBacklog, StatusPlanned, StatusInProgress, StatusPaused, StatusCompleted, StatusCancelled:
		return true
	default:
		return false
	}
}

func (s Status) String() string { return string(s) }
