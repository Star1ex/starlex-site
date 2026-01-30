package entity

import "time"

type Folder struct {
	ID       string
	Name     string
	Color    string
	Icon     string
	ParentID *string

	TeamID  *string
	OwnerID string

	Position int

	CreatedAt time.Time
	UpdatedAt time.Time
}

func NewFolder(id, name, color, icon string, parentID, teamID *string, ownerID string, position int) *Folder {
	return &Folder{
		ID:       id,
		Name:     name,
		Color:    color,
		Icon:     icon,
		ParentID: parentID,
		TeamID:   teamID,
		OwnerID:  ownerID,
		Position: position,
	}
}
