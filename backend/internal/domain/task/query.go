package task

import (
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
)

type SortField string

const (
	SortUpdatedAt SortField = "updated_at"
	SortCreatedAt SortField = "created_at"
	SortDueDate   SortField = "due_date"
	SortPriority  SortField = "priority"
	SortStatus    SortField = "status"
	SortKey       SortField = "key"
)

type SortDirection string

const (
	SortDesc SortDirection = "desc"
	SortAsc  SortDirection = "asc"
)

type QueryCursor struct {
	Value string
	ID    string
}

type Query struct {
	WorkspaceID string
	ProjectIDs  []string
	SprintIDs   []string
	Statuses    []string
	Priorities  []string
	AssigneeIDs []string
	LabelIDs    []string
	Search      string
	DueFrom     *time.Time
	DueTo       *time.Time
	SortBy      SortField
	Direction   SortDirection
	Limit       int
	Cursor      *QueryCursor
}

type QueryResult struct {
	Tasks      []*entity.Task
	NextCursor *QueryCursor
}

type CategoryItem struct {
	ID    string
	Name  string
	Color string
	Count int
}

type WorkspaceTaskCategories struct {
	Projects   []CategoryItem
	Statuses   []CategoryItem
	Priorities []CategoryItem
	Assignees  []CategoryItem
	Labels     []CategoryItem
	Due        []CategoryItem
}
