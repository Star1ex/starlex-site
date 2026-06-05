package service

import (
	"context"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	"github.com/Star1ex/starlex-site/internal/repository"
	"github.com/Star1ex/starlex-site/internal/security"
)

type FolderService struct {
	folderRepo *repository.FolderRepository
}

func NewFolderService(folderRepo *repository.FolderRepository) *FolderService {
	return &FolderService{folderRepo: folderRepo}
}

// make a new folder
func (s *FolderService) Create(ctx context.Context, folder *entity.Folder) error {

	folder.ID = security.GenerateNewID()
	return s.folderRepo.Create(ctx, folder)
}

// return folder by ID
func (s *FolderService) GetByID(ctx context.Context, id string) (*entity.Folder, error) {
	return s.folderRepo.GetByID(ctx, id)
}

// retrieves all user folders
func (s *FolderService) GetUserFolders(ctx context.Context, userID string) ([]*entity.Folder, error) {
	return s.folderRepo.GetUserFolders(ctx, userID)
}

// retrieves all workspace folders
func (s *FolderService) GetWorkspaceFolders(ctx context.Context, workspaceID string) ([]*entity.Folder, error) {
	return s.folderRepo.GetWorkspaceFolders(ctx, workspaceID)
}

// return sub folders by parentID
func (s FolderService) GetSubFolders(ctx context.Context, parentID string) ([]*entity.Folder, error) {
	return s.folderRepo.GetSubFolders(ctx, parentID)
}

// update folder
func (s *FolderService) Update(ctx context.Context, folder *entity.Folder) error {
	return s.folderRepo.Update(ctx, folder)
}

// delete folder by ID
func (s *FolderService) Delete(ctx context.Context, id string) error {
	return s.folderRepo.Delete(ctx, id)
}

// moving folder to another folder
func (s *FolderService) Move(ctx context.Context, folderID string, newParentID *string) error {
	return s.folderRepo.Move(ctx, folderID, newParentID)
}
