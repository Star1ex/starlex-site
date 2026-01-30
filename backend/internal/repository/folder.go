package repository

import (
	"context"
	"time"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"gorm.io/gorm"
)

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

type FolderRepository struct {
	db *gorm.DB
}

func NewFolderRepository(db *gorm.DB) *FolderRepository {
	return &FolderRepository{
		db: db,
	}
}

func (r *FolderModel) Create(ctx context.Context, folder *entity.Folder) error {

}
