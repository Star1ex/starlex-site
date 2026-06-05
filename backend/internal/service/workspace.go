package service

import (
	"context"
	"errors"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	"github.com/Star1ex/starlex-site/internal/domain/user"
	"github.com/Star1ex/starlex-site/internal/domain/workspace"
	"github.com/Star1ex/starlex-site/internal/security"
)

type WorkspaceService struct {
	workspaceRepo workspace.Repository
	userRepo      user.Repository
}

func NewWorkspaceService(workspaceRepo workspace.Repository, userRepo user.Repository) *WorkspaceService {
	return &WorkspaceService{workspaceRepo: workspaceRepo, userRepo: userRepo}
}

func (s *WorkspaceService) CreateWorkspace(ctx context.Context, name, description, userID string) (*entity.Workspace, error) {
	newId := security.GenerateNewID()

	newWorkspace := &entity.Workspace{
		ID:          newId,
		Name:        name,
		Description: description,
		OwnerID:     userID,
	}

	err := s.workspaceRepo.CreateAndAddCreator(ctx, newWorkspace, userID)
	if err != nil {
		return nil, err
	}

	return newWorkspace, nil
}

func (s WorkspaceService) Delete(ctx context.Context, workspaceID, userID string) error {

	workspace, err := s.workspaceRepo.GetWorkspaceByID(ctx, workspaceID)
	if err != nil {
		return err
	}
	if userID != workspace.OwnerID {
		return errors.New("only workspace owner can delete workspace")
	}

	return s.workspaceRepo.Delete(ctx, workspaceID)
}

func (s *WorkspaceService) UpdateWorkspaceName(ctx context.Context, workspaceID, name, userID string) error {
	workspace, err := s.workspaceRepo.GetWorkspaceByID(ctx, workspaceID)
	if err != nil {
		return err
	}
	if userID != workspace.OwnerID {
		return errors.New("only workspace owner can update workspace name")
	}
	return s.workspaceRepo.UpdateName(ctx, workspaceID, name)
}

func (s *WorkspaceService) UpdateWorkspaceDescription(ctx context.Context, workspaceID, description, userID string) error {
	workspace, err := s.workspaceRepo.GetWorkspaceByID(ctx, workspaceID)
	if err != nil {
		return err
	}
	if userID != workspace.OwnerID {
		return errors.New("only workspace owner can update workspace description")
	}
	return s.workspaceRepo.UpdateDescription(ctx, workspaceID, description)
}

func (s *WorkspaceService) UpdateWorkspaceIcon(ctx context.Context, workspaceID, icon, userID string) error {
	workspace, err := s.workspaceRepo.GetWorkspaceByID(ctx, workspaceID)
	if err != nil {
		return err
	}
	if userID != workspace.OwnerID {
		return errors.New("only workspace owner can update workspace icon")
	}
	return s.workspaceRepo.UpdateIcon(ctx, workspaceID, icon)
}

func (s *WorkspaceService) GetUsers(ctx context.Context, workspaceId string) ([]*entity.User, error) {
	users, err := s.workspaceRepo.GetWorkspace(ctx, workspaceId)
	if err != nil {
		return nil, err
	}
	return users, nil
}

func (s *WorkspaceService) GetWorkspaceByID(ctx context.Context, workspaceID string) (*entity.Workspace, error) {
	return s.workspaceRepo.GetWorkspaceByID(ctx, workspaceID)
}

func (s *WorkspaceService) AddUserToWorkspace(ctx context.Context, workspaceID string, email string, requesterID string) error {

	workspace, err := s.workspaceRepo.GetWorkspaceByID(ctx, workspaceID)
	if err != nil {
		return err
	}

	if workspace.OwnerID != requesterID {
		return errors.New("only workspace owner can add users")
	}

	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return err
	}

	return s.workspaceRepo.AddUserToWorkspace(ctx, workspaceID, user.ID)
}

func (s *WorkspaceService) RemoveUserFromWorkspace(ctx context.Context, workspaceID, userIDToRemove, currentUserID string) error {
	// Get workspace to check ownership
	workspace, err := s.workspaceRepo.GetWorkspaceByID(ctx, workspaceID)
	if err != nil {
		return err
	}

	// Check if current user is the workspace owner
	if workspace.OwnerID != currentUserID {
		return errors.New("only workspace owner can remove users")
	}

	// Remove user from workspace
	err = s.workspaceRepo.RemoveUserFromWorkspace(ctx, workspaceID, userIDToRemove)
	if err != nil {
		return err
	}

	return nil
}
