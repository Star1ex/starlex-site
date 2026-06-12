package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	domaininvite "github.com/Star1ex/starlex-site/internal/domain/invite"
	domainworkspace "github.com/Star1ex/starlex-site/internal/domain/workspace"
	"github.com/Star1ex/starlex-site/internal/repository"
	"github.com/Star1ex/starlex-site/internal/security"
)

var (
	ErrInviteInvalidExpiration = errors.New("invite: expires_in_hours must be greater than zero")
	ErrInviteInvalidMaxUses    = errors.New("invite: max_uses must be greater than zero")
)

type InviteService struct {
	inviteRepo    domaininvite.Repository
	workspaceRepo domainworkspace.Repository
}

func NewInviteService(inviteRepo domaininvite.Repository, workspaceRepo domainworkspace.Repository) *InviteService {
	return &InviteService{inviteRepo: inviteRepo, workspaceRepo: workspaceRepo}
}

func (s *InviteService) Create(ctx context.Context, workspaceID, roleValue, requesterID string, expiresInHours *int, maxUses *int) (*domaininvite.Invite, error) {
	requesterRole, err := s.requireWorkspaceRole(ctx, workspaceID, requesterID, domainworkspace.RoleAdmin)
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(roleValue) == "" {
		workspaceEntity, err := s.workspaceRepo.GetWorkspaceByID(ctx, workspaceID)
		if err != nil {
			return nil, err
		}
		roleValue = workspaceEntity.MemberDefaultRole
	}
	role, err := domainworkspace.ParseRole(roleValue)
	if err != nil {
		return nil, err
	}
	if role == domainworkspace.RoleOwner && requesterRole != domainworkspace.RoleOwner {
		return nil, ErrCannotManageOwner
	}

	var expiresAt *time.Time
	if expiresInHours != nil {
		if *expiresInHours <= 0 {
			return nil, ErrInviteInvalidExpiration
		}
		value := time.Now().UTC().Add(time.Duration(*expiresInHours) * time.Hour)
		expiresAt = &value
	}
	if maxUses != nil && *maxUses <= 0 {
		return nil, ErrInviteInvalidMaxUses
	}

	token, err := security.GenerateSecureToken(32)
	if err != nil {
		return nil, fmt.Errorf("createInvite: %w", err)
	}
	invite := &domaininvite.Invite{
		ID:          security.GenerateNewID(),
		WorkspaceID: workspaceID,
		Token:       token,
		Role:        string(role),
		CreatedBy:   requesterID,
		ExpiresAt:   expiresAt,
		MaxUses:     maxUses,
		CreatedAt:   time.Now().UTC(),
	}
	if err := s.inviteRepo.Create(ctx, invite); err != nil {
		return nil, fmt.Errorf("createInvite: %w", err)
	}
	return invite, nil
}

func (s *InviteService) Preview(ctx context.Context, token string) (*entity.Workspace, bool, error) {
	invite, err := s.inviteRepo.FindByToken(ctx, token)
	if err != nil {
		return nil, false, err
	}
	workspaceEntity, err := s.workspaceRepo.GetWorkspaceByID(ctx, invite.WorkspaceID)
	if err != nil {
		return nil, false, err
	}
	return workspaceEntity, invite.Valid(time.Now().UTC()), nil
}

func (s *InviteService) Accept(ctx context.Context, token, userID string) (*entity.Workspace, error) {
	invite, err := s.inviteRepo.FindByToken(ctx, token)
	if err != nil {
		return nil, err
	}
	if err := invite.InvalidReason(time.Now().UTC()); err != nil {
		return nil, err
	}

	if _, err := s.workspaceRepo.GetRole(ctx, invite.WorkspaceID, userID); err == nil {
		return s.workspaceForUser(ctx, invite.WorkspaceID, userID)
	} else if !errors.Is(err, repository.ErrUserNotInWorkspace) {
		return nil, err
	}

	consumed, err := s.inviteRepo.Consume(ctx, token, time.Now().UTC())
	if err != nil {
		return nil, err
	}
	role, err := domainworkspace.ParseRole(consumed.Role)
	if err != nil {
		return nil, err
	}
	if err := s.workspaceRepo.AddMember(ctx, consumed.WorkspaceID, userID, role); err != nil {
		if errors.Is(err, repository.ErrUserAlreadyInWorkspace) {
			return s.workspaceForUser(ctx, consumed.WorkspaceID, userID)
		}
		return nil, err
	}
	return s.workspaceForUser(ctx, consumed.WorkspaceID, userID)
}

func (s *InviteService) ListByWorkspace(ctx context.Context, workspaceID, requesterID string) ([]*domaininvite.Invite, error) {
	if _, err := s.requireWorkspaceRole(ctx, workspaceID, requesterID, domainworkspace.RoleAdmin); err != nil {
		return nil, err
	}
	return s.inviteRepo.ListByWorkspace(ctx, workspaceID)
}

func (s *InviteService) Revoke(ctx context.Context, id, requesterID string) error {
	invite, err := s.inviteRepo.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if _, err := s.requireWorkspaceRole(ctx, invite.WorkspaceID, requesterID, domainworkspace.RoleAdmin); err != nil {
		return err
	}
	if err := s.inviteRepo.Revoke(ctx, id, time.Now().UTC()); err != nil {
		return fmt.Errorf("revokeInvite: %w", err)
	}
	return nil
}

func (s *InviteService) requireWorkspaceRole(ctx context.Context, workspaceID, userID string, minRole domainworkspace.Role) (domainworkspace.Role, error) {
	role, err := s.workspaceRepo.GetRole(ctx, workspaceID, userID)
	if err != nil {
		return "", ErrWorkspaceForbidden
	}
	if !role.AtLeast(minRole) {
		return "", ErrWorkspaceForbidden
	}
	return role, nil
}

func (s *InviteService) workspaceForUser(ctx context.Context, workspaceID, userID string) (*entity.Workspace, error) {
	workspaceEntity, err := s.workspaceRepo.GetWorkspaceByID(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	role, err := s.workspaceRepo.GetRole(ctx, workspaceID, userID)
	if err != nil {
		return nil, err
	}
	memberCount, err := s.workspaceRepo.CountMembers(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	projectCount, err := s.workspaceRepo.CountProjects(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	workspaceEntity.Role = string(role)
	workspaceEntity.MemberCount = int(memberCount)
	workspaceEntity.ProjectCount = int(projectCount)
	return workspaceEntity, nil
}
