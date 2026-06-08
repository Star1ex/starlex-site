package service

import (
	"context"
	"errors"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	"github.com/Star1ex/starlex-site/internal/domain/user"
	"github.com/Star1ex/starlex-site/internal/domain/workspace"
	"github.com/Star1ex/starlex-site/internal/repository"
	"github.com/Star1ex/starlex-site/internal/security"
)

var (
	ErrWorkspaceForbidden      = errors.New("workspace: forbidden")
	ErrCannotRemoveOwner       = errors.New("workspace: cannot remove owner")
	ErrCannotDemoteLastOwner   = errors.New("workspace: cannot demote last owner")
	ErrCannotManageOwner       = errors.New("workspace: only owner can manage owner role")
	ErrWorkspaceMemberNotFound = errors.New("workspace: member not found")
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
		ID:           newId,
		Name:         name,
		Description:  description,
		OwnerID:      userID,
		KeyPrefix:    workspace.DeriveKeyPrefix(name),
		Role:         string(workspace.RoleOwner),
		MemberCount:  1,
		ProjectCount: 0,
	}

	err := s.workspaceRepo.CreateAndAddCreator(ctx, newWorkspace, userID)
	if err != nil {
		return nil, err
	}

	return newWorkspace, nil
}

func (s WorkspaceService) Delete(ctx context.Context, workspaceID, userID string) error {

	if _, err := s.workspaceRepo.GetWorkspaceByID(ctx, workspaceID); err != nil {
		return err
	}
	role, err := s.workspaceRepo.GetRole(ctx, workspaceID, userID)
	if err != nil || role != workspace.RoleOwner {
		return ErrWorkspaceForbidden
	}

	return s.workspaceRepo.Delete(ctx, workspaceID)
}

func (s *WorkspaceService) UpdateWorkspaceName(ctx context.Context, workspaceID, name, userID string) error {
	if err := s.requireRole(ctx, workspaceID, userID, workspace.RoleAdmin); err != nil {
		return err
	}
	return s.workspaceRepo.UpdateName(ctx, workspaceID, name)
}

func (s *WorkspaceService) UpdateWorkspaceDescription(ctx context.Context, workspaceID, description, userID string) error {
	if err := s.requireRole(ctx, workspaceID, userID, workspace.RoleAdmin); err != nil {
		return err
	}
	return s.workspaceRepo.UpdateDescription(ctx, workspaceID, description)
}

func (s *WorkspaceService) UpdateWorkspaceIcon(ctx context.Context, workspaceID, icon, userID string) error {
	if err := s.requireRole(ctx, workspaceID, userID, workspace.RoleAdmin); err != nil {
		return err
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

func (s *WorkspaceService) ListMembers(ctx context.Context, workspaceID string) ([]*workspace.Member, error) {
	return s.workspaceRepo.ListMembers(ctx, workspaceID)
}

func (s *WorkspaceService) GetRole(ctx context.Context, workspaceID, userID string) (workspace.Role, error) {
	return s.workspaceRepo.GetRole(ctx, workspaceID, userID)
}

func (s *WorkspaceService) AddUserToWorkspace(ctx context.Context, workspaceID string, email string, requesterID string) error {
	return s.AddMember(ctx, workspaceID, email, string(workspace.RoleMember), requesterID)
}

func (s *WorkspaceService) AddMember(ctx context.Context, workspaceID, email, roleValue, requesterID string) error {
	requesterRole, err := s.workspaceRepo.GetRole(ctx, workspaceID, requesterID)
	if err != nil {
		return err
	}
	if !requesterRole.AtLeast(workspace.RoleAdmin) {
		return ErrWorkspaceForbidden
	}
	role, err := workspace.ParseRole(roleValue)
	if err != nil {
		return err
	}
	if role == workspace.RoleOwner && requesterRole != workspace.RoleOwner {
		return ErrCannotManageOwner
	}

	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return err
	}

	return s.workspaceRepo.AddMember(ctx, workspaceID, user.ID, role)
}

func (s *WorkspaceService) RemoveUserFromWorkspace(ctx context.Context, workspaceID, userIDToRemove, currentUserID string) error {
	requesterRole, err := s.workspaceRepo.GetRole(ctx, workspaceID, currentUserID)
	if err != nil {
		return err
	}
	if !requesterRole.AtLeast(workspace.RoleAdmin) {
		return ErrWorkspaceForbidden
	}

	targetRole, err := s.workspaceRepo.GetRole(ctx, workspaceID, userIDToRemove)
	if err != nil {
		return ErrWorkspaceMemberNotFound
	}
	if targetRole == workspace.RoleOwner && requesterRole != workspace.RoleOwner {
		return ErrCannotRemoveOwner
	}
	if targetRole == workspace.RoleOwner {
		if err := s.ensureNotLastOwner(ctx, workspaceID); err != nil {
			return err
		}
	}

	err = s.workspaceRepo.RemoveUserFromWorkspace(ctx, workspaceID, userIDToRemove)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotInWorkspace) {
			return ErrWorkspaceMemberNotFound
		}
		return err
	}

	return nil
}

func (s *WorkspaceService) UpdateMemberRole(ctx context.Context, workspaceID, userID, roleValue, requesterID string) error {
	requesterRole, err := s.workspaceRepo.GetRole(ctx, workspaceID, requesterID)
	if err != nil {
		return err
	}
	if !requesterRole.AtLeast(workspace.RoleAdmin) {
		return ErrWorkspaceForbidden
	}

	nextRole, err := workspace.ParseRole(roleValue)
	if err != nil {
		return err
	}
	currentRole, err := s.workspaceRepo.GetRole(ctx, workspaceID, userID)
	if err != nil {
		return ErrWorkspaceMemberNotFound
	}
	if (currentRole == workspace.RoleOwner || nextRole == workspace.RoleOwner) && requesterRole != workspace.RoleOwner {
		return ErrCannotManageOwner
	}
	if currentRole == workspace.RoleOwner && nextRole != workspace.RoleOwner {
		if err := s.ensureNotLastOwner(ctx, workspaceID); err != nil {
			return err
		}
	}
	if err := s.workspaceRepo.UpdateMemberRole(ctx, workspaceID, userID, nextRole); err != nil {
		if errors.Is(err, repository.ErrUserNotInWorkspace) {
			return ErrWorkspaceMemberNotFound
		}
		return err
	}
	return nil
}

func (s *WorkspaceService) requireRole(ctx context.Context, workspaceID, userID string, minRole workspace.Role) error {
	role, err := s.workspaceRepo.GetRole(ctx, workspaceID, userID)
	if err != nil {
		return err
	}
	if !role.AtLeast(minRole) {
		return ErrWorkspaceForbidden
	}
	return nil
}

func (s *WorkspaceService) ensureNotLastOwner(ctx context.Context, workspaceID string) error {
	owners, err := s.workspaceRepo.CountOwners(ctx, workspaceID)
	if err != nil {
		return err
	}
	if owners <= 1 {
		return ErrCannotDemoteLastOwner
	}
	return nil
}
