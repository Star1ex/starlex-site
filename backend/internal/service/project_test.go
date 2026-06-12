package service

import (
	"context"
	"errors"
	"testing"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	"github.com/Star1ex/starlex-site/internal/domain/project"
	"github.com/Star1ex/starlex-site/internal/domain/user"
	"github.com/Star1ex/starlex-site/internal/domain/workspace"
)

// --- mocks (embed interfaces so only used methods need implementing) ---

type mockProjectRepo struct {
	project.Repository
	projects map[string]*entity.Project
	members  map[string]map[string]struct{} // projectID -> set of userIDs
}

func newMockProjectRepo() *mockProjectRepo {
	return &mockProjectRepo{
		projects: map[string]*entity.Project{},
		members:  map[string]map[string]struct{}{},
	}
}

func (m *mockProjectRepo) Create(_ context.Context, p *entity.Project) error {
	cp := *p
	m.projects[p.ID] = &cp
	set := map[string]struct{}{}
	for _, u := range p.Members {
		set[u.ID] = struct{}{}
	}
	m.members[p.ID] = set
	return nil
}

func (m *mockProjectRepo) GetByID(_ context.Context, id string) (*entity.Project, error) {
	p, ok := m.projects[id]
	if !ok {
		return nil, project.ErrProjectNotFound
	}
	out := *p
	members := make([]*entity.User, 0, len(m.members[id]))
	for uid := range m.members[id] {
		members = append(members, &entity.User{ID: uid})
	}
	out.Members = members
	return &out, nil
}

func (m *mockProjectRepo) IsMember(_ context.Context, projectID, userID string) (bool, error) {
	set, ok := m.members[projectID]
	if !ok {
		return false, nil
	}
	_, member := set[userID]
	return member, nil
}

func (m *mockProjectRepo) AddMember(_ context.Context, projectID, userID string) error {
	m.members[projectID][userID] = struct{}{}
	return nil
}

func (m *mockProjectRepo) RemoveMember(_ context.Context, projectID, userID string) error {
	delete(m.members[projectID], userID)
	return nil
}

func (m *mockProjectRepo) GetMembers(_ context.Context, projectID string) ([]*entity.User, error) {
	out := make([]*entity.User, 0, len(m.members[projectID]))
	for uid := range m.members[projectID] {
		out = append(out, &entity.User{ID: uid})
	}
	return out, nil
}

func (m *mockProjectRepo) Update(_ context.Context, id string, fields *project.UpdateFields) (*entity.Project, error) {
	p, ok := m.projects[id]
	if !ok {
		return nil, project.ErrProjectNotFound
	}
	if fields.Name != nil {
		p.Name = *fields.Name
	}
	if fields.Status != nil {
		p.Status = *fields.Status
	}
	if fields.Priority != nil {
		p.Priority = *fields.Priority
	}
	if fields.LeaderID != nil {
		p.LeaderID = *fields.LeaderID
	}
	return p, nil
}

func (m *mockProjectRepo) Delete(_ context.Context, id string) error {
	delete(m.projects, id)
	delete(m.members, id)
	return nil
}

func (m *mockProjectRepo) GetWorkspaceProjects(_ context.Context, workspaceID, userID string) ([]*entity.Project, error) {
	var out []*entity.Project
	for id, p := range m.projects {
		if p.WorkspaceID != workspaceID {
			continue
		}
		if _, ok := m.members[id][userID]; ok {
			out = append(out, p)
		}
	}
	return out, nil
}

type mockWorkspaceRepo struct {
	workspace.Repository
	members map[string][]string // workspaceID -> userIDs
	roles   map[string]map[string]workspace.Role
}

func (m *mockWorkspaceRepo) GetWorkspace(_ context.Context, workspaceID string) ([]*entity.User, error) {
	ids := m.members[workspaceID]
	out := make([]*entity.User, len(ids))
	for i, id := range ids {
		out[i] = &entity.User{ID: id}
	}
	return out, nil
}

func (m *mockWorkspaceRepo) GetRole(_ context.Context, workspaceID, userID string) (workspace.Role, error) {
	if workspaceRoles, ok := m.roles[workspaceID]; ok {
		role, ok := workspaceRoles[userID]
		if !ok {
			return "", errors.New("user not in workspace")
		}
		return role, nil
	}
	for _, id := range m.members[workspaceID] {
		if id == userID {
			return workspace.RoleMember, nil
		}
	}
	return "", errors.New("user not in workspace")
}

type mockUserRepo struct {
	user.Repository
	byEmail map[string]*entity.User
}

func (m *mockUserRepo) GetByEmail(_ context.Context, email string) (*entity.User, error) {
	u, ok := m.byEmail[email]
	if !ok {
		return nil, errors.New("user not found")
	}
	return u, nil
}

// --- helpers ---

func newServiceWithWorkspace(wsID string, memberIDs ...string) (*ProjectService, *mockProjectRepo, *mockWorkspaceRepo, *mockUserRepo) {
	pr := newMockProjectRepo()
	wr := &mockWorkspaceRepo{members: map[string][]string{wsID: memberIDs}}
	ur := &mockUserRepo{byEmail: map[string]*entity.User{}}
	return NewProjectService(pr, wr, ur), pr, wr, ur
}

// --- tests ---

func TestCreateProject_Success(t *testing.T) {
	svc, _, _, _ := newServiceWithWorkspace("ws1", "u1", "u2")
	p, err := svc.CreateProject(context.Background(), "ws1", project.CreateInput{Name: "  Apollo  "}, "u1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if p.Name != "Apollo" {
		t.Errorf("name not trimmed: %q", p.Name)
	}
	if p.Status != string(project.DefaultStatus) || p.Priority != string(project.DefaultPriority) {
		t.Errorf("defaults not applied: status=%q priority=%q", p.Status, p.Priority)
	}
	if p.LeaderID != "u1" || p.CreatedBy != "u1" {
		t.Errorf("creator should default as leader: leader=%q createdBy=%q", p.LeaderID, p.CreatedBy)
	}
	if len(p.Members) != 1 {
		t.Errorf("creator must be a member, got %d members", len(p.Members))
	}
}

func TestCreateProject_NonWorkspaceMember(t *testing.T) {
	svc, _, _, _ := newServiceWithWorkspace("ws1", "u1")
	_, err := svc.CreateProject(context.Background(), "ws1", project.CreateInput{Name: "X"}, "intruder")
	if !errors.Is(err, project.ErrNotMember) {
		t.Fatalf("want ErrNotMember, got %v", err)
	}
}

func TestCreateProject_GuestCannotCreate(t *testing.T) {
	svc, _, wr, _ := newServiceWithWorkspace("ws1", "guest")
	wr.roles = map[string]map[string]workspace.Role{
		"ws1": {"guest": workspace.RoleGuest},
	}

	_, err := svc.CreateProject(context.Background(), "ws1", project.CreateInput{Name: "X"}, "guest")
	if !errors.Is(err, project.ErrNotMember) {
		t.Fatalf("want ErrNotMember, got %v", err)
	}
}

func TestCreateProject_Validation(t *testing.T) {
	svc, _, _, _ := newServiceWithWorkspace("ws1", "u1")
	if _, err := svc.CreateProject(context.Background(), "ws1", project.CreateInput{Name: "   "}, "u1"); !errors.Is(err, project.ErrEmptyName) {
		t.Errorf("want ErrEmptyName, got %v", err)
	}
	if _, err := svc.CreateProject(context.Background(), "ws1", project.CreateInput{Name: "X", Status: "bogus"}, "u1"); !errors.Is(err, project.ErrInvalidStatus) {
		t.Errorf("want ErrInvalidStatus, got %v", err)
	}
	if _, err := svc.CreateProject(context.Background(), "ws1", project.CreateInput{Name: "X", Priority: "bogus"}, "u1"); !errors.Is(err, project.ErrInvalidPriority) {
		t.Errorf("want ErrInvalidPriority, got %v", err)
	}
}

func TestCreateProject_MemberMustBeInWorkspace(t *testing.T) {
	svc, _, _, _ := newServiceWithWorkspace("ws1", "u1")
	_, err := svc.CreateProject(context.Background(), "ws1", project.CreateInput{Name: "X", MemberIDs: []string{"outsider"}}, "u1")
	if !errors.Is(err, project.ErrLeaderNotMember) {
		t.Fatalf("want ErrLeaderNotMember, got %v", err)
	}
}

func TestGetProjectByID_RequiresMembership(t *testing.T) {
	svc, _, _, _ := newServiceWithWorkspace("ws1", "u1", "u2")
	p, _ := svc.CreateProject(context.Background(), "ws1", project.CreateInput{Name: "X"}, "u1")
	if _, err := svc.GetProjectByID(context.Background(), p.ID, "u2"); !errors.Is(err, project.ErrNotMember) {
		t.Errorf("u2 is not a project member, want ErrNotMember, got %v", err)
	}
	if _, err := svc.GetProjectByID(context.Background(), p.ID, "u1"); err != nil {
		t.Errorf("creator should access project: %v", err)
	}
}

func TestUpdateProject_InvalidStatus(t *testing.T) {
	svc, _, _, _ := newServiceWithWorkspace("ws1", "u1")
	p, _ := svc.CreateProject(context.Background(), "ws1", project.CreateInput{Name: "X"}, "u1")
	bad := "nope"
	_, err := svc.UpdateProject(context.Background(), p.ID, project.UpdateFields{Status: &bad}, "u1")
	if !errors.Is(err, project.ErrInvalidStatus) {
		t.Fatalf("want ErrInvalidStatus, got %v", err)
	}
}

func TestAddMember(t *testing.T) {
	svc, _, _, ur := newServiceWithWorkspace("ws1", "u1", "u2")
	ur.byEmail["u2@x.io"] = &entity.User{ID: "u2", Email: "u2@x.io"}
	p, _ := svc.CreateProject(context.Background(), "ws1", project.CreateInput{Name: "X"}, "u1")

	if err := svc.AddMember(context.Background(), p.ID, "u2@x.io", "u1"); err != nil {
		t.Fatalf("add member failed: %v", err)
	}
	// adding again -> already member
	if err := svc.AddMember(context.Background(), p.ID, "u2@x.io", "u1"); !errors.Is(err, project.ErrAlreadyMember) {
		t.Errorf("want ErrAlreadyMember, got %v", err)
	}
}

func TestRemoveMember_CannotRemoveLeader(t *testing.T) {
	svc, _, _, _ := newServiceWithWorkspace("ws1", "u1", "u2")
	p, _ := svc.CreateProject(context.Background(), "ws1", project.CreateInput{Name: "X"}, "u1")
	if err := svc.RemoveMember(context.Background(), p.ID, "u1", "u1"); !errors.Is(err, project.ErrCannotRemoveLeader) {
		t.Fatalf("want ErrCannotRemoveLeader, got %v", err)
	}
}

func TestGetWorkspaceProjects(t *testing.T) {
	svc, _, _, _ := newServiceWithWorkspace("ws1", "u1", "u2")
	_, _ = svc.CreateProject(context.Background(), "ws1", project.CreateInput{Name: "A"}, "u1")
	_, _ = svc.CreateProject(context.Background(), "ws1", project.CreateInput{Name: "B"}, "u1")

	got, err := svc.GetWorkspaceProjects(context.Background(), "ws1", "u1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got) != 2 {
		t.Errorf("want 2 projects for u1, got %d", len(got))
	}
	// u2 is in the workspace but not a member of either project.
	got2, err := svc.GetWorkspaceProjects(context.Background(), "ws1", "u2")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(got2) != 0 {
		t.Errorf("u2 is not a project member, want 0, got %d", len(got2))
	}
	// non-workspace member is rejected.
	if _, err := svc.GetWorkspaceProjects(context.Background(), "ws1", "ghost"); !errors.Is(err, project.ErrNotMember) {
		t.Errorf("want ErrNotMember, got %v", err)
	}
}

func TestUpdateProject_Success(t *testing.T) {
	svc, _, _, _ := newServiceWithWorkspace("ws1", "u1", "u2")
	p, _ := svc.CreateProject(context.Background(), "ws1", project.CreateInput{
		Name:      "X",
		MemberIDs: []string{"u2"},
	}, "u1")

	name := "Renamed"
	status := string(project.StatusInProgress)
	priority := string(project.PriorityHigh)
	leader := "u2" // u2 is a project member, so valid
	updated, err := svc.UpdateProject(context.Background(), p.ID, project.UpdateFields{
		Name:     &name,
		Status:   &status,
		Priority: &priority,
		LeaderID: &leader,
	}, "u1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.Name != "Renamed" || updated.Status != status || updated.Priority != priority || updated.LeaderID != "u2" {
		t.Errorf("update did not apply: %+v", updated)
	}
}

func TestUpdateProject_ProjectMemberCannotManage(t *testing.T) {
	svc, _, _, _ := newServiceWithWorkspace("ws1", "u1", "u2")
	p, _ := svc.CreateProject(context.Background(), "ws1", project.CreateInput{
		Name:      "X",
		MemberIDs: []string{"u2"},
	}, "u1")

	name := "Renamed"
	_, err := svc.UpdateProject(context.Background(), p.ID, project.UpdateFields{Name: &name}, "u2")
	if !errors.Is(err, project.ErrNotMember) {
		t.Fatalf("want ErrNotMember, got %v", err)
	}
}

func TestUpdateProject_WorkspaceAdminCanManageWithoutProjectMembership(t *testing.T) {
	svc, _, wr, _ := newServiceWithWorkspace("ws1", "u1", "admin")
	wr.roles = map[string]map[string]workspace.Role{
		"ws1": {
			"u1":    workspace.RoleMember,
			"admin": workspace.RoleAdmin,
		},
	}
	p, _ := svc.CreateProject(context.Background(), "ws1", project.CreateInput{Name: "X"}, "u1")

	name := "Admin renamed"
	updated, err := svc.UpdateProject(context.Background(), p.ID, project.UpdateFields{Name: &name}, "admin")
	if err != nil {
		t.Fatalf("admin should manage workspace project: %v", err)
	}
	if updated.Name != name {
		t.Fatalf("want renamed project, got %q", updated.Name)
	}
}

func TestUpdateProject_LeaderMustBeMember(t *testing.T) {
	svc, _, _, _ := newServiceWithWorkspace("ws1", "u1", "u2")
	p, _ := svc.CreateProject(context.Background(), "ws1", project.CreateInput{Name: "X"}, "u1")
	leader := "u2" // not a project member
	_, err := svc.UpdateProject(context.Background(), p.ID, project.UpdateFields{LeaderID: &leader}, "u1")
	if !errors.Is(err, project.ErrLeaderNotMember) {
		t.Fatalf("want ErrLeaderNotMember, got %v", err)
	}
}

func TestDeleteAndGetMembers(t *testing.T) {
	svc, _, _, _ := newServiceWithWorkspace("ws1", "u1")
	p, _ := svc.CreateProject(context.Background(), "ws1", project.CreateInput{Name: "X"}, "u1")

	members, err := svc.GetMembers(context.Background(), p.ID, "u1")
	if err != nil {
		t.Fatalf("get members failed: %v", err)
	}
	if len(members) != 1 {
		t.Errorf("want 1 member, got %d", len(members))
	}

	if err := svc.Delete(context.Background(), p.ID, "u1"); err != nil {
		t.Fatalf("delete failed: %v", err)
	}
	if _, err := svc.GetProjectByID(context.Background(), p.ID, "u1"); !errors.Is(err, project.ErrProjectNotFound) {
		t.Errorf("deleted project should be gone (no membership), got %v", err)
	}
}

func TestEnsureMember(t *testing.T) {
	svc, _, _, _ := newServiceWithWorkspace("ws1", "u1")
	p, _ := svc.CreateProject(context.Background(), "ws1", project.CreateInput{Name: "X"}, "u1")
	if err := svc.EnsureMember(context.Background(), p.ID, "u1"); err != nil {
		t.Errorf("u1 should be a member: %v", err)
	}
	if err := svc.EnsureMember(context.Background(), p.ID, "ghost"); !errors.Is(err, project.ErrNotMember) {
		t.Errorf("want ErrNotMember, got %v", err)
	}
}
