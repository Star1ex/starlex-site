package service

import (
	"context"
	"strings"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	"github.com/Star1ex/starlex-site/internal/domain/project"
	"github.com/Star1ex/starlex-site/internal/domain/user"
	"github.com/Star1ex/starlex-site/internal/domain/workspace"
	"github.com/Star1ex/starlex-site/internal/security"
)

// ProjectService implements project use cases. Project membership controls
// read access; project leaders and workspace admins manage the project.
type ProjectService struct {
	projectRepo   project.Repository
	workspaceRepo workspace.Repository
	userRepo      user.Repository
}

func NewProjectService(
	projectRepo project.Repository,
	workspaceRepo workspace.Repository,
	userRepo user.Repository,
) *ProjectService {
	return &ProjectService{
		projectRepo:   projectRepo,
		workspaceRepo: workspaceRepo,
		userRepo:      userRepo,
	}
}

// isWorkspaceMember reports whether userID belongs to the workspace.
func (s *ProjectService) isWorkspaceMember(ctx context.Context, workspaceID, userID string) (bool, error) {
	users, err := s.workspaceRepo.GetWorkspace(ctx, workspaceID)
	if err != nil {
		return false, err
	}
	for _, u := range users {
		if u.ID == userID {
			return true, nil
		}
	}
	return false, nil
}

// requireProjectMember returns project.ErrNotMember unless userID is a member.
func (s *ProjectService) requireProjectMember(ctx context.Context, projectID, userID string) error {
	ok, err := s.projectRepo.IsMember(ctx, projectID, userID)
	if err != nil {
		return err
	}
	if !ok {
		return project.ErrNotMember
	}
	return nil
}

func (s *ProjectService) requireWorkspaceRole(ctx context.Context, workspaceID, userID string, minRole workspace.Role) error {
	role, err := s.workspaceRepo.GetRole(ctx, workspaceID, userID)
	if err != nil {
		return project.ErrNotMember
	}
	if !role.AtLeast(minRole) {
		return project.ErrNotMember
	}
	return nil
}

func (s *ProjectService) canReadProject(ctx context.Context, p *entity.Project, userID string) error {
	role, err := s.workspaceRepo.GetRole(ctx, p.WorkspaceID, userID)
	if err != nil {
		return project.ErrNotMember
	}
	if role.AtLeast(workspace.RoleAdmin) {
		return nil
	}
	ok, err := s.projectRepo.IsMember(ctx, p.ID, userID)
	if err != nil {
		return err
	}
	if ok {
		return nil
	}
	return project.ErrNotMember
}

func (s *ProjectService) canManageProject(ctx context.Context, p *entity.Project, userID string) error {
	role, err := s.workspaceRepo.GetRole(ctx, p.WorkspaceID, userID)
	if err != nil {
		return project.ErrNotMember
	}
	if role.AtLeast(workspace.RoleAdmin) {
		return nil
	}
	if p.LeaderID == userID && role.AtLeast(workspace.RoleMember) {
		return nil
	}
	return project.ErrNotMember
}

func normalizeStatus(raw string) (project.Status, error) {
	if strings.TrimSpace(raw) == "" {
		return project.DefaultStatus, nil
	}
	s := project.Status(raw)
	if !s.Valid() {
		return "", project.ErrInvalidStatus
	}
	return s, nil
}

func normalizePriority(raw string) (project.Priority, error) {
	if strings.TrimSpace(raw) == "" {
		return project.DefaultPriority, nil
	}
	p := project.Priority(raw)
	if !p.Valid() {
		return "", project.ErrInvalidPriority
	}
	return p, nil
}

func (s *ProjectService) CreateProject(ctx context.Context, workspaceID string, in project.CreateInput, userID string) (*entity.Project, error) {
	if err := s.requireWorkspaceRole(ctx, workspaceID, userID, workspace.RoleMember); err != nil {
		return nil, project.ErrNotMember
	}

	name := strings.TrimSpace(in.Name)
	if name == "" {
		return nil, project.ErrEmptyName
	}

	status, err := normalizeStatus(in.Status)
	if err != nil {
		return nil, err
	}
	priority, err := normalizePriority(in.Priority)
	if err != nil {
		return nil, err
	}

	leaderID := strings.TrimSpace(in.LeaderID)
	if leaderID == "" {
		leaderID = userID
	}

	// Build the member set: creator + leader + requested members. All members
	// must belong to the workspace.
	memberSet := map[string]struct{}{userID: {}, leaderID: {}}
	for _, id := range in.MemberIDs {
		if strings.TrimSpace(id) != "" {
			memberSet[id] = struct{}{}
		}
	}
	members := make([]*entity.User, 0, len(memberSet))
	for id := range memberSet {
		isMember, err := s.isWorkspaceMember(ctx, workspaceID, id)
		if err != nil {
			return nil, err
		}
		if !isMember {
			return nil, project.ErrLeaderNotMember
		}
		members = append(members, &entity.User{ID: id})
	}

	p := entity.NewProject(
		security.GenerateNewID(),
		workspaceID,
		name,
		in.Description,
		in.Goal,
		in.Icon,
		priority.String(),
		status.String(),
		leaderID,
		userID,
		in.Deadline,
	)
	p.Members = members

	if err := s.projectRepo.Create(ctx, p); err != nil {
		return nil, err
	}
	return s.projectRepo.GetByID(ctx, p.ID)
}

func (s *ProjectService) GetProjectByID(ctx context.Context, projectID, userID string) (*entity.Project, error) {
	p, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if err := s.canReadProject(ctx, p, userID); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *ProjectService) GetWorkspaceProjects(ctx context.Context, workspaceID, userID string) ([]*entity.Project, error) {
	ok, err := s.isWorkspaceMember(ctx, workspaceID, userID)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, project.ErrNotMember
	}
	return s.projectRepo.GetWorkspaceProjects(ctx, workspaceID, userID)
}

func (s *ProjectService) UpdateProject(ctx context.Context, projectID string, fields project.UpdateFields, userID string) (*entity.Project, error) {
	p, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if err := s.canManageProject(ctx, p, userID); err != nil {
		return nil, err
	}

	if fields.Status != nil {
		status, err := normalizeStatus(*fields.Status)
		if err != nil {
			return nil, err
		}
		normalized := status.String()
		fields.Status = &normalized
	}
	if fields.Priority != nil {
		priority, err := normalizePriority(*fields.Priority)
		if err != nil {
			return nil, err
		}
		normalized := priority.String()
		fields.Priority = &normalized
	}
	if fields.Name != nil {
		name := strings.TrimSpace(*fields.Name)
		if name == "" {
			return nil, project.ErrEmptyName
		}
		fields.Name = &name
	}
	if fields.LeaderID != nil {
		leaderID := strings.TrimSpace(*fields.LeaderID)
		ok, err := s.projectRepo.IsMember(ctx, projectID, leaderID)
		if err != nil {
			return nil, err
		}
		if !ok {
			return nil, project.ErrLeaderNotMember
		}
		fields.LeaderID = &leaderID
	}

	return s.projectRepo.Update(ctx, projectID, &fields)
}

func (s *ProjectService) Delete(ctx context.Context, projectID, userID string) error {
	p, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return err
	}
	if err := s.canManageProject(ctx, p, userID); err != nil {
		return err
	}
	return s.projectRepo.Delete(ctx, projectID)
}

func (s *ProjectService) GetMembers(ctx context.Context, projectID, userID string) ([]*entity.User, error) {
	p, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if err := s.canReadProject(ctx, p, userID); err != nil {
		return nil, err
	}
	return s.projectRepo.GetMembers(ctx, projectID)
}

func (s *ProjectService) AddMember(ctx context.Context, projectID, email, requesterID string) error {
	p, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return err
	}
	if err := s.canManageProject(ctx, p, requesterID); err != nil {
		return err
	}
	target, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return err
	}
	// The new member must already belong to the workspace.
	ok, err := s.isWorkspaceMember(ctx, p.WorkspaceID, target.ID)
	if err != nil {
		return err
	}
	if !ok {
		return project.ErrLeaderNotMember
	}
	already, err := s.projectRepo.IsMember(ctx, projectID, target.ID)
	if err != nil {
		return err
	}
	if already {
		return project.ErrAlreadyMember
	}
	return s.projectRepo.AddMember(ctx, projectID, target.ID)
}

func (s *ProjectService) RemoveMember(ctx context.Context, projectID, userIDToRemove, requesterID string) error {
	p, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return err
	}
	if err := s.canManageProject(ctx, p, requesterID); err != nil {
		return err
	}
	if p.LeaderID == userIDToRemove {
		return project.ErrCannotRemoveLeader
	}
	return s.projectRepo.RemoveMember(ctx, projectID, userIDToRemove)
}

func (s *ProjectService) EnsureMember(ctx context.Context, projectID, userID string) error {
	return s.requireProjectMember(ctx, projectID, userID)
}
