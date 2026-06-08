package entity

type Workspace struct {
	ID                string
	Name              string
	Description       string
	Icon              string
	Color             string
	OwnerID           string
	KeyPrefix         string
	TaskSeq           int64
	DefaultTaskStatus string
	MemberDefaultRole string
	Role              string
	MemberCount       int
	ProjectCount      int
}

type UpdateWorkspace struct {
	Name        string
	Description string
}

func NewWorkspace(id, name, description string) *Workspace {
	return &Workspace{
		ID:          id,
		Name:        name,
		Description: description,
	}
}
