package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	domainlabel "github.com/Star1ex/starlex-site/internal/domain/label"
	"github.com/Star1ex/starlex-site/internal/domain/user"
	"github.com/Star1ex/starlex-site/internal/domain/workspace"
	"github.com/Star1ex/starlex-site/internal/repository"
)

type workspaceRoleRepo struct {
	workspace.Repository
	roles   map[string]map[string]workspace.Role
	members map[string][]*workspace.Member
	owners  map[string]int64
	added   map[string]workspace.Role
	updated map[string]workspace.Role
	removed map[string]bool
	colors  map[string]string
}

func newWorkspaceRoleRepo() *workspaceRoleRepo {
	return &workspaceRoleRepo{
		roles:   map[string]map[string]workspace.Role{},
		members: map[string][]*workspace.Member{},
		owners:  map[string]int64{},
		added:   map[string]workspace.Role{},
		updated: map[string]workspace.Role{},
		removed: map[string]bool{},
		colors:  map[string]string{},
	}
}

func (m *workspaceRoleRepo) ListMembers(_ context.Context, workspaceID string) ([]*workspace.Member, error) {
	return m.members[workspaceID], nil
}

func (m *workspaceRoleRepo) GetRole(_ context.Context, workspaceID, userID string) (workspace.Role, error) {
	workspaceRoles, ok := m.roles[workspaceID]
	if !ok {
		return "", repository.ErrWorkspaceNotFound
	}
	role, ok := workspaceRoles[userID]
	if !ok {
		return "", repository.ErrUserNotInWorkspace
	}
	return role, nil
}

func (m *workspaceRoleRepo) CountOwners(_ context.Context, workspaceID string) (int64, error) {
	return m.owners[workspaceID], nil
}

func (m *workspaceRoleRepo) AddMember(_ context.Context, workspaceID, userID string, role workspace.Role) error {
	if _, ok := m.roles[workspaceID]; !ok {
		m.roles[workspaceID] = map[string]workspace.Role{}
	}
	m.roles[workspaceID][userID] = role
	m.added[userID] = role
	return nil
}

func (m *workspaceRoleRepo) UpdateMemberRole(_ context.Context, workspaceID, userID string, role workspace.Role) error {
	if _, err := m.GetRole(context.Background(), workspaceID, userID); err != nil {
		return err
	}
	m.roles[workspaceID][userID] = role
	m.updated[userID] = role
	return nil
}

func (m *workspaceRoleRepo) RemoveUserFromWorkspace(_ context.Context, workspaceID string, userID string) error {
	if _, err := m.GetRole(context.Background(), workspaceID, userID); err != nil {
		return err
	}
	delete(m.roles[workspaceID], userID)
	m.removed[userID] = true
	return nil
}

func (m *workspaceRoleRepo) UpdateColor(_ context.Context, workspaceID string, color string) error {
	m.colors[workspaceID] = color
	return nil
}

type workspaceUserRepo struct {
	user.Repository
	byEmail map[string]*entity.User
}

func (m *workspaceUserRepo) GetByEmail(_ context.Context, email string) (*entity.User, error) {
	found, ok := m.byEmail[email]
	if !ok {
		return nil, repository.ErrUserNotFound
	}
	return found, nil
}

func TestWorkspaceServiceListMembersAndGetRole(t *testing.T) {
	joinedAt := time.Date(2026, 6, 8, 12, 0, 0, 0, time.UTC)
	repo := newWorkspaceRoleRepo()
	repo.roles["ws1"] = map[string]workspace.Role{"owner": workspace.RoleOwner}
	repo.members["ws1"] = []*workspace.Member{
		{User: &entity.User{ID: "owner", Email: "owner@example.com"}, Role: workspace.RoleOwner, JoinedAt: joinedAt},
	}
	service := NewWorkspaceService(repo, &workspaceUserRepo{})

	tests := []struct {
		name string
		run  func(t *testing.T)
	}{
		{
			name: "list members delegates to repository",
			run: func(t *testing.T) {
				members, err := service.ListMembers(context.Background(), "ws1")
				if err != nil {
					t.Fatalf("unexpected error: %v", err)
				}
				if len(members) != 1 || members[0].Role != workspace.RoleOwner {
					t.Fatalf("unexpected members: %#v", members)
				}
			},
		},
		{
			name: "get role delegates to repository",
			run: func(t *testing.T) {
				role, err := service.GetRole(context.Background(), "ws1", "owner")
				if err != nil {
					t.Fatalf("unexpected error: %v", err)
				}
				if role != workspace.RoleOwner {
					t.Fatalf("want owner, got %q", role)
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, tt.run)
	}
}

func TestWorkspaceServiceAddMemberRoleGuards(t *testing.T) {
	tests := []struct {
		name          string
		requesterRole workspace.Role
		targetRole    string
		wantErr       error
		wantAddedRole workspace.Role
	}{
		{
			name:          "guest cannot add members",
			requesterRole: workspace.RoleGuest,
			targetRole:    string(workspace.RoleMember),
			wantErr:       ErrWorkspaceForbidden,
		},
		{
			name:          "admin can add member",
			requesterRole: workspace.RoleAdmin,
			targetRole:    string(workspace.RoleMember),
			wantAddedRole: workspace.RoleMember,
		},
		{
			name:          "admin cannot create owner",
			requesterRole: workspace.RoleAdmin,
			targetRole:    string(workspace.RoleOwner),
			wantErr:       ErrCannotManageOwner,
		},
		{
			name:          "invalid role is rejected",
			requesterRole: workspace.RoleOwner,
			targetRole:    "bogus",
			wantErr:       workspace.ErrInvalidRole,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := newWorkspaceRoleRepo()
			repo.roles["ws1"] = map[string]workspace.Role{"requester": tt.requesterRole}
			users := &workspaceUserRepo{
				byEmail: map[string]*entity.User{
					"target@example.com": {ID: "target", Email: "target@example.com"},
				},
			}
			service := NewWorkspaceService(repo, users)

			err := service.AddMember(context.Background(), "ws1", "target@example.com", tt.targetRole, "requester")
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("want error %v, got %v", tt.wantErr, err)
			}
			if tt.wantErr == nil && repo.added["target"] != tt.wantAddedRole {
				t.Fatalf("want added role %q, got %q", tt.wantAddedRole, repo.added["target"])
			}
			if tt.wantErr != nil && repo.added["target"] != "" {
				t.Fatalf("target should not be added on error, got role %q", repo.added["target"])
			}
		})
	}
}

func TestWorkspaceServiceUpdateMemberRoleGuards(t *testing.T) {
	tests := []struct {
		name          string
		requesterRole workspace.Role
		targetRole    workspace.Role
		nextRole      string
		ownerCount    int64
		wantErr       error
		wantRole      workspace.Role
	}{
		{
			name:          "guest cannot update roles",
			requesterRole: workspace.RoleGuest,
			targetRole:    workspace.RoleMember,
			nextRole:      string(workspace.RoleAdmin),
			ownerCount:    1,
			wantErr:       ErrWorkspaceForbidden,
		},
		{
			name:          "admin can promote member",
			requesterRole: workspace.RoleAdmin,
			targetRole:    workspace.RoleMember,
			nextRole:      string(workspace.RoleAdmin),
			ownerCount:    1,
			wantRole:      workspace.RoleAdmin,
		},
		{
			name:          "admin cannot demote owner",
			requesterRole: workspace.RoleAdmin,
			targetRole:    workspace.RoleOwner,
			nextRole:      string(workspace.RoleMember),
			ownerCount:    2,
			wantErr:       ErrCannotManageOwner,
		},
		{
			name:          "owner cannot demote last owner",
			requesterRole: workspace.RoleOwner,
			targetRole:    workspace.RoleOwner,
			nextRole:      string(workspace.RoleMember),
			ownerCount:    1,
			wantErr:       ErrCannotDemoteLastOwner,
		},
		{
			name:          "owner can promote member to owner",
			requesterRole: workspace.RoleOwner,
			targetRole:    workspace.RoleMember,
			nextRole:      string(workspace.RoleOwner),
			ownerCount:    1,
			wantRole:      workspace.RoleOwner,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := newWorkspaceRoleRepo()
			repo.roles["ws1"] = map[string]workspace.Role{
				"requester": tt.requesterRole,
				"target":    tt.targetRole,
			}
			repo.owners["ws1"] = tt.ownerCount
			service := NewWorkspaceService(repo, &workspaceUserRepo{})

			err := service.UpdateMemberRole(context.Background(), "ws1", "target", tt.nextRole, "requester")
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("want error %v, got %v", tt.wantErr, err)
			}
			if tt.wantErr == nil && repo.updated["target"] != tt.wantRole {
				t.Fatalf("want updated role %q, got %q", tt.wantRole, repo.updated["target"])
			}
			if tt.wantErr != nil && repo.updated["target"] != "" {
				t.Fatalf("target should not be updated on error, got role %q", repo.updated["target"])
			}
		})
	}
}

func TestWorkspaceServiceRemoveMemberGuards(t *testing.T) {
	tests := []struct {
		name          string
		requesterRole workspace.Role
		targetRole    workspace.Role
		ownerCount    int64
		wantErr       error
		wantRemoved   bool
	}{
		{
			name:          "guest cannot remove members",
			requesterRole: workspace.RoleGuest,
			targetRole:    workspace.RoleMember,
			ownerCount:    1,
			wantErr:       ErrWorkspaceForbidden,
		},
		{
			name:          "admin can remove member",
			requesterRole: workspace.RoleAdmin,
			targetRole:    workspace.RoleMember,
			ownerCount:    1,
			wantRemoved:   true,
		},
		{
			name:          "admin cannot remove owner",
			requesterRole: workspace.RoleAdmin,
			targetRole:    workspace.RoleOwner,
			ownerCount:    2,
			wantErr:       ErrCannotRemoveOwner,
		},
		{
			name:          "owner cannot remove last owner",
			requesterRole: workspace.RoleOwner,
			targetRole:    workspace.RoleOwner,
			ownerCount:    1,
			wantErr:       ErrCannotDemoteLastOwner,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := newWorkspaceRoleRepo()
			repo.roles["ws1"] = map[string]workspace.Role{
				"requester": tt.requesterRole,
				"target":    tt.targetRole,
			}
			repo.owners["ws1"] = tt.ownerCount
			service := NewWorkspaceService(repo, &workspaceUserRepo{})

			err := service.RemoveUserFromWorkspace(context.Background(), "ws1", "target", "requester")
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("want error %v, got %v", tt.wantErr, err)
			}
			if repo.removed["target"] != tt.wantRemoved {
				t.Fatalf("want removed=%v, got %v", tt.wantRemoved, repo.removed["target"])
			}
		})
	}
}

func TestWorkspaceServiceUpdateWorkspaceColor(t *testing.T) {
	tests := []struct {
		name          string
		requesterRole workspace.Role
		color         string
		wantErr       error
		wantColor     string
	}{
		{name: "admin can update color", requesterRole: workspace.RoleAdmin, color: "#22aa99", wantColor: "#22aa99"},
		{name: "guest cannot update color", requesterRole: workspace.RoleGuest, color: "#22aa99", wantErr: ErrWorkspaceForbidden},
		{name: "invalid color rejected", requesterRole: workspace.RoleAdmin, color: "blue", wantErr: domainlabel.ErrInvalidColor},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := newWorkspaceRoleRepo()
			repo.roles["ws1"] = map[string]workspace.Role{"requester": tt.requesterRole}
			service := NewWorkspaceService(repo, &workspaceUserRepo{})

			err := service.UpdateWorkspaceColor(context.Background(), "ws1", tt.color, "requester")
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("want error %v, got %v", tt.wantErr, err)
			}
			if repo.colors["ws1"] != tt.wantColor {
				t.Fatalf("want color %q, got %q", tt.wantColor, repo.colors["ws1"])
			}
		})
	}
}
