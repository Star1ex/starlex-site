package service

import (
	"context"
	"regexp"
	"strings"

	domainlabel "github.com/Star1ex/starlex-site/internal/domain/label"
	domainworkspace "github.com/Star1ex/starlex-site/internal/domain/workspace"
	"github.com/Star1ex/starlex-site/internal/security"
)

var hexColorPattern = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)

type LabelService struct {
	labelRepo     domainlabel.Repository
	workspaceRepo domainworkspace.Repository
}

func NewLabelService(labelRepo domainlabel.Repository, workspaceRepo domainworkspace.Repository) *LabelService {
	return &LabelService{labelRepo: labelRepo, workspaceRepo: workspaceRepo}
}

func (s *LabelService) Create(ctx context.Context, workspaceID, name, color, requesterID string) (*domainlabel.Label, error) {
	if _, err := s.requireWorkspaceRole(ctx, workspaceID, requesterID, domainworkspace.RoleAdmin); err != nil {
		return nil, err
	}
	name, color, err := normalizeLabelInput(name, color)
	if err != nil {
		return nil, err
	}
	label := &domainlabel.Label{
		ID:          security.GenerateNewID(),
		WorkspaceID: workspaceID,
		Name:        name,
		Color:       color,
	}
	if err := s.labelRepo.Create(ctx, label); err != nil {
		return nil, err
	}
	return label, nil
}

func (s *LabelService) ListByWorkspace(ctx context.Context, workspaceID, requesterID string) ([]*domainlabel.Label, error) {
	if _, err := s.requireWorkspaceRole(ctx, workspaceID, requesterID, domainworkspace.RoleGuest); err != nil {
		return nil, err
	}
	return s.labelRepo.ListByWorkspace(ctx, workspaceID)
}

func (s *LabelService) Update(ctx context.Context, id string, name *string, color *string, requesterID string) (*domainlabel.Label, error) {
	current, err := s.labelRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if _, err := s.requireWorkspaceRole(ctx, current.WorkspaceID, requesterID, domainworkspace.RoleAdmin); err != nil {
		return nil, err
	}

	var normalizedName *string
	if name != nil {
		value := strings.TrimSpace(*name)
		if value == "" {
			return nil, domainlabel.ErrInvalidName
		}
		normalizedName = &value
	}
	var normalizedColor *string
	if color != nil {
		value := strings.TrimSpace(*color)
		if !hexColorPattern.MatchString(value) {
			return nil, domainlabel.ErrInvalidColor
		}
		normalizedColor = &value
	}
	return s.labelRepo.Update(ctx, id, normalizedName, normalizedColor)
}

func (s *LabelService) Delete(ctx context.Context, id, requesterID string) error {
	current, err := s.labelRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if _, err := s.requireWorkspaceRole(ctx, current.WorkspaceID, requesterID, domainworkspace.RoleAdmin); err != nil {
		return err
	}
	return s.labelRepo.Delete(ctx, id)
}

func (s *LabelService) requireWorkspaceRole(ctx context.Context, workspaceID, userID string, minRole domainworkspace.Role) (domainworkspace.Role, error) {
	role, err := s.workspaceRepo.GetRole(ctx, workspaceID, userID)
	if err != nil {
		return "", ErrWorkspaceForbidden
	}
	if !role.AtLeast(minRole) {
		return "", ErrWorkspaceForbidden
	}
	return role, nil
}

func normalizeLabelInput(name, color string) (string, string, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return "", "", domainlabel.ErrInvalidName
	}
	color = strings.TrimSpace(color)
	if !hexColorPattern.MatchString(color) {
		return "", "", domainlabel.ErrInvalidColor
	}
	return name, color, nil
}
