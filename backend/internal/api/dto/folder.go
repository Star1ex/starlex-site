package dto

import (
	"time"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
)

type FolderDTO struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Color    string  `json:"color"`
	Icon     string  `json:"icon"`
	ParentID *string `json:"parent_id"`

	TeamID  *string `json:"team_id"`
	OwnerID string  `json:"owner_id"`

	Position int `json:"position"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type FolderGetByIdDTO struct {
	ID string `json:"id" binding:"required"`
}

func ToDomainFolder(dto *FolderDTO) *entity.Folder {
	return &entity.Folder{
		ID:        dto.ID,
		Name:      dto.Name,
		Color:     dto.Color,
		Icon:      dto.Icon,
		ParentID:  dto.ParentID,
		TeamID:    dto.TeamID,
		OwnerID:   dto.OwnerID,
		Position:  dto.Position,
		CreatedAt: dto.CreatedAt,
		UpdatedAt: dto.UpdatedAt,
	}
}

func FromDomainFolder(entity *entity.Folder) *FolderDTO {
	return &FolderDTO{
		ID:        entity.ID,
		Name:      entity.Name,
		Color:     entity.Color,
		Icon:      entity.Icon,
		ParentID:  entity.ParentID,
		TeamID:    entity.TeamID,
		OwnerID:   entity.OwnerID,
		Position:  entity.Position,
		CreatedAt: entity.CreatedAt,
		UpdatedAt: entity.UpdatedAt,
	}
}
