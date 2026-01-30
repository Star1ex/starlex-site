package repository

import "time"

type FolderModel struct {
	ID       string  `gorm:"primaryKey"`
	Name     string  `gorm:"not null"`
	Color    string  `gorm:"default: '#gray'"`
	Icon     string  `gorm:"default:null"`
	ParentID *string `gorm:"default:null;index"`

	TeamID  *string `gorm:"default:null;index"`
	OwnerID string  `gorm:"not null;index"`

	Position int `gorm:"default:0"`

	CreatedAt time.Time
	UpdatedAt time.Time
}
