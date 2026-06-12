package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	domaininvite "github.com/Star1ex/starlex-site/internal/domain/invite"
	domainworkspace "github.com/Star1ex/starlex-site/internal/domain/workspace"
	"github.com/Star1ex/starlex-site/internal/repository"
)

type inviteRepoMock struct {
	invitesByToken map[string]*domaininvite.Invite
	invitesByID    map[string]*domaininvite.Invite
	consumeCount   int
	revoked        map[string]bool
}

func newInviteRepoMock(invites ...*domaininvite.Invite) *inviteRepoMock {
	repo := &inviteRepoMock{
		invitesByToken: map[string]*domaininvite.Invite{},
		invitesByID:    map[string]*domaininvite.Invite{},
		revoked:        map[string]bool{},
	}
	for _, invite := range invites {
		repo.invitesByToken[invite.Token] = invite
		repo.invitesByID[invite.ID] = invite
	}
	return repo
}

func (m *inviteRepoMock) Create(_ context.Context, invite *domaininvite.Invite) error {
	m.invitesByToken[invite.Token] = invite
	m.invitesByID[invite.ID] = invite
	return nil
}

func (m *inviteRepoMock) FindByToken(_ context.Context, token string) (*domaininvite.Invite, error) {
	invite, ok := m.invitesByToken[token]
	if !ok {
		return nil, domaininvite.ErrInviteNotFound
	}
	return invite, nil
}

func (m *inviteRepoMock) FindByID(_ context.Context, id string) (*domaininvite.Invite, error) {
	invite, ok := m.invitesByID[id]
	if !ok {
		return nil, domaininvite.ErrInviteNotFound
	}
	return invite, nil
}

func (m *inviteRepoMock) ListByWorkspace(_ context.Context, workspaceID string) ([]*domaininvite.Invite, error) {
	var out []*domaininvite.Invite
	for _, invite := range m.invitesByID {
		if invite.WorkspaceID == workspaceID {
			out = append(out, invite)
		}
	}
	return out, nil
}

func (m *inviteRepoMock) Consume(_ context.Context, token string, now time.Time) (*domaininvite.Invite, error) {
	invite, err := m.FindByToken(context.Background(), token)
	if err != nil {
		return nil, err
	}
	if err := invite.InvalidReason(now); err != nil {
		return nil, err
	}
	invite.UseCount++
	m.consumeCount++
	return invite, nil
}

func (m *inviteRepoMock) Revoke(_ context.Context, id string, revokedAt time.Time) error {
	invite, err := m.FindByID(context.Background(), id)
	if err != nil {
		return err
	}
	invite.RevokedAt = &revokedAt
	m.revoked[id] = true
	return nil
}

type inviteWorkspaceRepoMock struct {
	domainworkspace.Repository
	roles         map[string]map[string]domainworkspace.Role
	workspaces    map[string]*entity.Workspace
	projectCounts map[string]int64
}

func newInviteWorkspaceRepoMock() *inviteWorkspaceRepoMock {
	return &inviteWorkspaceRepoMock{
		roles:         map[string]map[string]domainworkspace.Role{},
		workspaces:    map[string]*entity.Workspace{},
		projectCounts: map[string]int64{},
	}
}

func (m *inviteWorkspaceRepoMock) GetWorkspaceByID(_ context.Context, workspaceID string) (*entity.Workspace, error) {
	workspace, ok := m.workspaces[workspaceID]
	if !ok {
		return nil, repository.ErrWorkspaceNotFound
	}
	cp := *workspace
	return &cp, nil
}

func (m *inviteWorkspaceRepoMock) GetRole(_ context.Context, workspaceID, userID string) (domainworkspace.Role, error) {
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

func (m *inviteWorkspaceRepoMock) AddMember(_ context.Context, workspaceID, userID string, role domainworkspace.Role) error {
	if _, ok := m.roles[workspaceID]; !ok {
		return repository.ErrWorkspaceNotFound
	}
	if _, exists := m.roles[workspaceID][userID]; exists {
		return repository.ErrUserAlreadyInWorkspace
	}
	m.roles[workspaceID][userID] = role
	return nil
}

func (m *inviteWorkspaceRepoMock) CountMembers(_ context.Context, workspaceID string) (int64, error) {
	return int64(len(m.roles[workspaceID])), nil
}

func (m *inviteWorkspaceRepoMock) CountProjects(_ context.Context, workspaceID string) (int64, error) {
	return m.projectCounts[workspaceID], nil
}

func TestInviteServiceAccept(t *testing.T) {
	now := time.Now().UTC()
	future := now.Add(time.Hour)
	past := now.Add(-time.Hour)
	maxOne := 1
	revokedAt := now

	tests := []struct {
		name              string
		invite            *domaininvite.Invite
		initialUserRole   domainworkspace.Role
		wantErr           error
		wantRole          string
		wantConsumeCount  int
		wantUseCount      int
		wantMemberCount   int
		wantProjectCount  int
		wantExistingCount bool
	}{
		{
			name: "happy path adds member with invite role",
			invite: &domaininvite.Invite{
				ID:          "invite1",
				WorkspaceID: "ws1",
				Token:       "token1",
				Role:        string(domainworkspace.RoleGuest),
				ExpiresAt:   &future,
			},
			wantRole:         string(domainworkspace.RoleGuest),
			wantConsumeCount: 1,
			wantUseCount:     1,
			wantMemberCount:  2,
			wantProjectCount: 3,
		},
		{
			name: "expired invite rejected",
			invite: &domaininvite.Invite{
				ID:          "invite2",
				WorkspaceID: "ws1",
				Token:       "token2",
				Role:        string(domainworkspace.RoleMember),
				ExpiresAt:   &past,
			},
			wantErr: domaininvite.ErrInviteExpired,
		},
		{
			name: "over max uses rejected",
			invite: &domaininvite.Invite{
				ID:          "invite3",
				WorkspaceID: "ws1",
				Token:       "token3",
				Role:        string(domainworkspace.RoleMember),
				MaxUses:     &maxOne,
				UseCount:    1,
			},
			wantErr: domaininvite.ErrInviteMaxUsesReached,
		},
		{
			name: "revoked invite rejected",
			invite: &domaininvite.Invite{
				ID:          "invite4",
				WorkspaceID: "ws1",
				Token:       "token4",
				Role:        string(domainworkspace.RoleMember),
				RevokedAt:   &revokedAt,
			},
			wantErr: domaininvite.ErrInviteRevoked,
		},
		{
			name: "already member is idempotent and does not consume",
			invite: &domaininvite.Invite{
				ID:          "invite5",
				WorkspaceID: "ws1",
				Token:       "token5",
				Role:        string(domainworkspace.RoleAdmin),
			},
			initialUserRole:  domainworkspace.RoleMember,
			wantRole:         string(domainworkspace.RoleMember),
			wantMemberCount:  2,
			wantProjectCount: 3,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			inviteRepo := newInviteRepoMock(tt.invite)
			workspaceRepo := newInviteWorkspaceRepoMock()
			workspaceRepo.workspaces["ws1"] = &entity.Workspace{ID: "ws1", Name: "Workspace"}
			workspaceRepo.roles["ws1"] = map[string]domainworkspace.Role{"owner": domainworkspace.RoleOwner}
			workspaceRepo.projectCounts["ws1"] = 3
			if tt.initialUserRole != "" {
				workspaceRepo.roles["ws1"]["user"] = tt.initialUserRole
			}
			service := NewInviteService(inviteRepo, workspaceRepo)

			workspace, err := service.Accept(context.Background(), tt.invite.Token, "user")
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("want error %v, got %v", tt.wantErr, err)
			}
			if tt.wantErr != nil {
				if inviteRepo.consumeCount != 0 {
					t.Fatalf("invalid invite should not be consumed")
				}
				return
			}
			if workspace.Role != tt.wantRole {
				t.Fatalf("want role %q, got %q", tt.wantRole, workspace.Role)
			}
			if inviteRepo.consumeCount != tt.wantConsumeCount {
				t.Fatalf("want consume count %d, got %d", tt.wantConsumeCount, inviteRepo.consumeCount)
			}
			if tt.invite.UseCount != tt.wantUseCount {
				t.Fatalf("want use count %d, got %d", tt.wantUseCount, tt.invite.UseCount)
			}
			if workspace.MemberCount != tt.wantMemberCount {
				t.Fatalf("want member count %d, got %d", tt.wantMemberCount, workspace.MemberCount)
			}
			if workspace.ProjectCount != tt.wantProjectCount {
				t.Fatalf("want project count %d, got %d", tt.wantProjectCount, workspace.ProjectCount)
			}
		})
	}
}

func TestInviteServiceCreateRoleGuards(t *testing.T) {
	validHours := 24
	validMaxUses := 5
	invalidHours := 0
	invalidMaxUses := 0

	tests := []struct {
		name          string
		requesterRole domainworkspace.Role
		role          string
		expiresHours  *int
		maxUses       *int
		wantErr       error
		wantRole      string
	}{
		{
			name:          "admin can create member invite",
			requesterRole: domainworkspace.RoleAdmin,
			role:          string(domainworkspace.RoleMember),
			expiresHours:  &validHours,
			maxUses:       &validMaxUses,
			wantRole:      string(domainworkspace.RoleMember),
		},
		{
			name:          "guest cannot create invite",
			requesterRole: domainworkspace.RoleGuest,
			role:          string(domainworkspace.RoleMember),
			wantErr:       ErrWorkspaceForbidden,
		},
		{
			name:          "admin cannot create owner invite",
			requesterRole: domainworkspace.RoleAdmin,
			role:          string(domainworkspace.RoleOwner),
			wantErr:       ErrCannotManageOwner,
		},
		{
			name:          "owner can create owner invite",
			requesterRole: domainworkspace.RoleOwner,
			role:          string(domainworkspace.RoleOwner),
			wantRole:      string(domainworkspace.RoleOwner),
		},
		{
			name:          "empty role uses workspace default invite role",
			requesterRole: domainworkspace.RoleAdmin,
			role:          "",
			wantRole:      string(domainworkspace.RoleGuest),
		},
		{
			name:          "invalid expiration rejected",
			requesterRole: domainworkspace.RoleOwner,
			role:          string(domainworkspace.RoleMember),
			expiresHours:  &invalidHours,
			wantErr:       ErrInviteInvalidExpiration,
		},
		{
			name:          "invalid max uses rejected",
			requesterRole: domainworkspace.RoleOwner,
			role:          string(domainworkspace.RoleMember),
			maxUses:       &invalidMaxUses,
			wantErr:       ErrInviteInvalidMaxUses,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			inviteRepo := newInviteRepoMock()
			workspaceRepo := newInviteWorkspaceRepoMock()
			workspaceRepo.roles["ws1"] = map[string]domainworkspace.Role{"requester": tt.requesterRole}
			workspaceRepo.workspaces["ws1"] = &entity.Workspace{
				ID:                "ws1",
				Name:              "Workspace",
				MemberDefaultRole: string(domainworkspace.RoleGuest),
			}
			service := NewInviteService(inviteRepo, workspaceRepo)

			invite, err := service.Create(context.Background(), "ws1", tt.role, "requester", tt.expiresHours, tt.maxUses)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("want error %v, got %v", tt.wantErr, err)
			}
			if tt.wantErr != nil {
				return
			}
			if invite.Role != tt.wantRole {
				t.Fatalf("want role %q, got %q", tt.wantRole, invite.Role)
			}
			if invite.Token == "" {
				t.Fatalf("invite token must be generated")
			}
		})
	}
}

func TestInviteServicePreviewListAndRevoke(t *testing.T) {
	now := time.Now().UTC()
	past := now.Add(-time.Hour)
	invite := &domaininvite.Invite{
		ID:          "invite1",
		WorkspaceID: "ws1",
		Token:       "token1",
		Role:        string(domainworkspace.RoleMember),
		ExpiresAt:   &past,
	}
	inviteRepo := newInviteRepoMock(invite)
	workspaceRepo := newInviteWorkspaceRepoMock()
	workspaceRepo.workspaces["ws1"] = &entity.Workspace{ID: "ws1", Name: "Workspace"}
	workspaceRepo.roles["ws1"] = map[string]domainworkspace.Role{"admin": domainworkspace.RoleAdmin}
	service := NewInviteService(inviteRepo, workspaceRepo)

	workspace, valid, err := service.Preview(context.Background(), "token1")
	if err != nil {
		t.Fatalf("preview failed: %v", err)
	}
	if workspace.ID != "ws1" || valid {
		t.Fatalf("want expired preview for ws1, got workspace=%#v valid=%v", workspace, valid)
	}

	invites, err := service.ListByWorkspace(context.Background(), "ws1", "admin")
	if err != nil {
		t.Fatalf("list invites failed: %v", err)
	}
	if len(invites) != 1 || invites[0].ID != "invite1" {
		t.Fatalf("unexpected invites: %#v", invites)
	}

	if err := service.Revoke(context.Background(), "invite1", "admin"); err != nil {
		t.Fatalf("revoke failed: %v", err)
	}
	if !inviteRepo.revoked["invite1"] {
		t.Fatalf("invite was not revoked")
	}
}
