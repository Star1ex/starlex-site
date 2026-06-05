package dto

import (
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
)

type FolderDTO struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Color    string  `json:"color"`
	Icon     string  `json:"icon"`
	ParentID *string `json:"parent_id"`

	WorkspaceID *string `json:"workspace_id"`
	OwnerID     string  `json:"owner_id"`

	Position int `json:"position"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type FolderGetByIdDTO struct {
	ID string `json:"id" binding:"required"`
}

type FolderDeleteDTO struct {
	ID string `json:"id" binding:"required"`
}

type FolderGetByParentIdDTO struct {
	ParentID string `json:"parent_id" binding:"required"`
}

type FolderMoveDTO struct {
	FolderID string `json:"folder_id" binding:"required"`
	ParentID string `json:"parent_id"`
}

func ToDomainFolder(dto *FolderDTO) *entity.Folder {
	return &entity.Folder{
		ID:          dto.ID,
		Name:        dto.Name,
		Color:       dto.Color,
		Icon:        dto.Icon,
		ParentID:    dto.ParentID,
		WorkspaceID: dto.WorkspaceID,
		OwnerID:     dto.OwnerID,
		Position:    dto.Position,
		CreatedAt:   dto.CreatedAt,
		UpdatedAt:   dto.UpdatedAt,
	}
}

func FromDomainFolder(entity *entity.Folder) *FolderDTO {
	return &FolderDTO{
		ID:          entity.ID,
		Name:        entity.Name,
		Color:       entity.Color,
		Icon:        entity.Icon,
		ParentID:    entity.ParentID,
		WorkspaceID: entity.WorkspaceID,
		OwnerID:     entity.OwnerID,
		Position:    entity.Position,
		CreatedAt:   entity.CreatedAt,
		UpdatedAt:   entity.UpdatedAt,
	}
}

func FromDomainFolders(entities []*entity.Folder) []*FolderDTO {
	response := make([]*FolderDTO, len(entities))
	for i, folder := range entities {
		response[i] = FromDomainFolder(folder)
	}
	return response
}
