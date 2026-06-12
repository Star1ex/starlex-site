package project

// Priority is a value object describing the importance of a project,
// modelled after Linear priorities.
type Priority string

const (
	PriorityNone   Priority = "none"
	PriorityUrgent Priority = "urgent"
	PriorityHigh   Priority = "high"
	PriorityMedium Priority = "medium"
	PriorityLow    Priority = "low"
)

// DefaultPriority is applied when a project is created without an explicit priority.
const DefaultPriority = PriorityNone

// Valid reports whether p is a known project priority.
func (p Priority) Valid() bool {
	switch p {
	case PriorityNone, PriorityUrgent, PriorityHigh, PriorityMedium, PriorityLow:
		return true
	default:
		return false
	}
}

func (p Priority) String() string { return string(p) }
