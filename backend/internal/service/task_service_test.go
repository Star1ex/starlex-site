package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	"github.com/Star1ex/starlex-site/internal/domain/task"
	"github.com/Star1ex/starlex-site/internal/domain/user"
	"github.com/Star1ex/starlex-site/internal/domain/workspace"
)

// --- mocks (embed interfaces so only used methods need implementing) ---

type mockTaskRepo struct {
	task.Repository
	created        []*entity.Task
	statusUpdates  map[string]string
	dueDateUpdates map[string]*time.Time
}

func (m *mockTaskRepo) Create(_ context.Context, t *entity.Task) error {
	cp := *t
	m.created = append(m.created, &cp)
	return nil
}

func (m *mockTaskRepo) UpdateStatus(_ context.Context, id string, status string) error {
	if m.statusUpdates == nil {
		m.statusUpdates = map[string]string{}
	}
	m.statusUpdates[id] = status
	return nil
}

func (m *mockTaskRepo) UpdateDueDate(_ context.Context, id string, dueDate *time.Time) error {
	if m.dueDateUpdates == nil {
		m.dueDateUpdates = map[string]*time.Time{}
	}
	m.dueDateUpdates[id] = dueDate
	return nil
}

type mockTaskWorkspaceRepo struct {
	workspace.Repository
	existing map[string]*entity.Workspace
}

func (m *mockTaskWorkspaceRepo) GetWorkspaceByID(_ context.Context, id string) (*entity.Workspace, error) {
	ws, ok := m.existing[id]
	if !ok {
		return nil, errors.New("workspace not found")
	}
	return ws, nil
}

type mockTaskUserRepo struct {
	user.Repository
	byID map[string]*entity.User
}

func (m *mockTaskUserRepo) GetByIDs(_ context.Context, ids []string) ([]*entity.User, error) {
	out := make([]*entity.User, 0, len(ids))
	for _, id := range ids {
		if u, ok := m.byID[id]; ok {
			out = append(out, u)
		}
	}
	return out, nil
}

func newTaskService(wsID, ownerID string) (*TaskService, *mockTaskRepo) {
	tr := &mockTaskRepo{statusUpdates: map[string]string{}, dueDateUpdates: map[string]*time.Time{}}
	wr := &mockTaskWorkspaceRepo{existing: map[string]*entity.Workspace{
		wsID: {ID: wsID, OwnerID: ownerID},
	}}
	ur := &mockTaskUserRepo{byID: map[string]*entity.User{}}
	return NewTaskService(tr, ur, wr), tr
}

// --- tests ---

// Any workspace member (not only the owner) may create tasks. The service no
// longer enforces ownership; it only verifies the workspace exists.
func TestCreateWorkspaceTask_NonOwnerAllowed(t *testing.T) {
	svc, tr := newTaskService("ws1", "owner")

	entityTask := &entity.Task{Task: "Do it"}
	err := svc.CreateWorkspaceTask(context.Background(), "ws1", nil, entityTask, "member")
	if err != nil {
		t.Fatalf("non-owner member should be allowed to create a task: %v", err)
	}
	if len(tr.created) != 1 {
		t.Fatalf("want 1 created task, got %d", len(tr.created))
	}
	got := tr.created[0]
	if got.WorkspaceID != "ws1" {
		t.Errorf("workspace not set: %q", got.WorkspaceID)
	}
	if got.OwnerID != "member" {
		t.Errorf("creator should be recorded as owner: %q", got.OwnerID)
	}
	if got.ID == "" {
		t.Error("task ID should be generated")
	}
	if got.Status != string(task.StatusTodo) {
		t.Errorf("default status should be todo, got %q", got.Status)
	}
}

func TestCreateWorkspaceTask_RequiresWorkspaceID(t *testing.T) {
	svc, _ := newTaskService("ws1", "owner")
	err := svc.CreateWorkspaceTask(context.Background(), "", nil, &entity.Task{Task: "x"}, "u1")
	if err == nil {
		t.Fatal("empty workspace id must be rejected")
	}
}

func TestCreateWorkspaceTask_WorkspaceMustExist(t *testing.T) {
	svc, _ := newTaskService("ws1", "owner")
	err := svc.CreateWorkspaceTask(context.Background(), "ghost", nil, &entity.Task{Task: "x"}, "u1")
	if err == nil {
		t.Fatal("missing workspace must be rejected")
	}
}

func TestCreateWorkspaceTask_AssignsUsers(t *testing.T) {
	svc, tr := newTaskService("ws1", "owner")
	// register assignable users
	ur := svc.userRepo.(*mockTaskUserRepo)
	ur.byID["a"] = &entity.User{ID: "a"}
	ur.byID["b"] = &entity.User{ID: "b"}

	err := svc.CreateWorkspaceTask(context.Background(), "ws1", []string{"a", "b"}, &entity.Task{Task: "x"}, "u1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if n := len(tr.created[0].AssignedTo); n != 2 {
		t.Errorf("want 2 assignees, got %d", n)
	}
}

func TestCreateWorkspaceTask_StatusValidation(t *testing.T) {
	tests := []struct {
		name       string
		status     string
		wantErr    error
		wantStatus string
	}{
		{name: "empty defaults to todo", wantStatus: string(task.StatusTodo)},
		{name: "explicit status persists", status: string(task.StatusInReview), wantStatus: string(task.StatusInReview)},
		{name: "invalid status rejected", status: "blocked", wantErr: task.ErrInvalidStatus},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc, tr := newTaskService("ws1", "owner")
			err := svc.CreateWorkspaceTask(context.Background(), "ws1", nil, &entity.Task{Task: "x", Status: tt.status}, "u1")
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("want error %v, got %v", tt.wantErr, err)
			}
			if tt.wantErr != nil {
				if len(tr.created) != 0 {
					t.Fatalf("invalid status should not create task")
				}
				return
			}
			if tr.created[0].Status != tt.wantStatus {
				t.Fatalf("want status %q, got %q", tt.wantStatus, tr.created[0].Status)
			}
		})
	}
}

func TestUpdateTaskStatus(t *testing.T) {
	tests := []struct {
		name       string
		status     string
		wantErr    error
		wantStatus string
	}{
		{name: "valid status persists", status: string(task.StatusDone), wantStatus: string(task.StatusDone)},
		{name: "invalid status rejected", status: "almost_done", wantErr: task.ErrInvalidStatus},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc, tr := newTaskService("ws1", "owner")
			err := svc.UpdateTaskStatus(context.Background(), "task1", tt.status)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("want error %v, got %v", tt.wantErr, err)
			}
			if tt.wantErr != nil {
				if tr.statusUpdates["task1"] != "" {
					t.Fatalf("invalid status should not persist")
				}
				return
			}
			if tr.statusUpdates["task1"] != tt.wantStatus {
				t.Fatalf("want status %q, got %q", tt.wantStatus, tr.statusUpdates["task1"])
			}
		})
	}
}

func TestUpdateTaskDueDate(t *testing.T) {
	svc, tr := newTaskService("ws1", "owner")
	dueDate := time.Date(2026, 6, 9, 12, 0, 0, 0, time.UTC)

	if err := svc.UpdateTaskDueDate(context.Background(), "task1", &dueDate); err != nil {
		t.Fatalf("set due date failed: %v", err)
	}
	if tr.dueDateUpdates["task1"] == nil || !tr.dueDateUpdates["task1"].Equal(dueDate) {
		t.Fatalf("due date was not set: %#v", tr.dueDateUpdates["task1"])
	}

	if err := svc.UpdateTaskDueDate(context.Background(), "task1", nil); err != nil {
		t.Fatalf("clear due date failed: %v", err)
	}
	if tr.dueDateUpdates["task1"] != nil {
		t.Fatalf("due date was not cleared: %#v", tr.dueDateUpdates["task1"])
	}
}
