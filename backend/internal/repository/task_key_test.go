package repository

import (
	"context"
	"errors"
	"testing"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	domainlabel "github.com/Star1ex/starlex-site/internal/domain/label"
	domaintask "github.com/Star1ex/starlex-site/internal/domain/task"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func newTaskKeyDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite db: %v", err)
	}
	if err := db.AutoMigrate(&UserModel{}, &WorkspaceModel{}, &LabelModel{}, &TaskModel{}, &SubtaskModel{}); err != nil {
		t.Fatalf("migrate test db: %v", err)
	}
	return db
}

func TestTaskRepositoryUpdateLabelsReplacesWorkspaceLabels(t *testing.T) {
	db := newTaskKeyDB(t)
	repo := NewTaskRepository(db)

	if err := db.Create(&WorkspaceModel{ID: "ws1", Name: "Alpha", KeyPrefix: "ALP"}).Error; err != nil {
		t.Fatalf("create workspace 1: %v", err)
	}
	if err := db.Create(&WorkspaceModel{ID: "ws2", Name: "Beta", KeyPrefix: "BET"}).Error; err != nil {
		t.Fatalf("create workspace 2: %v", err)
	}
	if err := db.Create(&LabelModel{ID: "label1", WorkspaceID: "ws1", Name: "Bug", Color: "#ff0033"}).Error; err != nil {
		t.Fatalf("create label 1: %v", err)
	}
	if err := db.Create(&LabelModel{ID: "label2", WorkspaceID: "ws2", Name: "Other", Color: "#00aa88"}).Error; err != nil {
		t.Fatalf("create label 2: %v", err)
	}

	task := &entity.Task{ID: "task1", Task: "A", WorkspaceID: "ws1", OwnerID: "u1", Priority: "low", Status: string(domaintask.StatusTodo)}
	if err := repo.Create(context.Background(), task); err != nil {
		t.Fatalf("create task: %v", err)
	}

	if err := repo.UpdateLabels(context.Background(), "task1", []string{"label1"}); err != nil {
		t.Fatalf("replace task labels: %v", err)
	}
	reloaded, err := repo.Get(context.Background(), "task1")
	if err != nil {
		t.Fatalf("reload task: %v", err)
	}
	if len(reloaded.Labels) != 1 || reloaded.Labels[0].ID != "label1" {
		t.Fatalf("unexpected labels: %#v", reloaded.Labels)
	}

	if err := repo.UpdateLabels(context.Background(), "task1", []string{"label2"}); !errors.Is(err, domainlabel.ErrLabelNotFound) {
		t.Fatalf("cross-workspace label want ErrLabelNotFound, got %v", err)
	}

	if err := repo.UpdateLabels(context.Background(), "task1", nil); err != nil {
		t.Fatalf("clear task labels: %v", err)
	}
	reloaded, err = repo.Get(context.Background(), "task1")
	if err != nil {
		t.Fatalf("reload task after clear: %v", err)
	}
	if len(reloaded.Labels) != 0 {
		t.Fatalf("labels were not cleared: %#v", reloaded.Labels)
	}
}

func TestTaskRepositoryCreateAssignsWorkspaceKeysPerWorkspace(t *testing.T) {
	db := newTaskKeyDB(t)
	repo := NewTaskRepository(db)

	if err := db.Create(&WorkspaceModel{ID: "ws1", Name: "Alpha Team", KeyPrefix: "ALP"}).Error; err != nil {
		t.Fatalf("create workspace 1: %v", err)
	}
	if err := db.Create(&WorkspaceModel{ID: "ws2", Name: "Beta Team", KeyPrefix: "BET"}).Error; err != nil {
		t.Fatalf("create workspace 2: %v", err)
	}

	tasks := []*entity.Task{
		{ID: "task1", Task: "A", Description: "", WorkspaceID: "ws1", OwnerID: "u1", Priority: "low", Status: string(domaintask.StatusTodo)},
		{ID: "task2", Task: "B", Description: "", WorkspaceID: "ws1", OwnerID: "u1", Priority: "low", Status: string(domaintask.StatusTodo)},
		{ID: "task3", Task: "C", Description: "", WorkspaceID: "ws2", OwnerID: "u1", Priority: "low", Status: string(domaintask.StatusTodo)},
	}

	for _, task := range tasks {
		if err := repo.Create(context.Background(), task); err != nil {
			t.Fatalf("create task %s: %v", task.ID, err)
		}
	}

	wantKeys := map[string]string{
		"task1": "ALP-1",
		"task2": "ALP-2",
		"task3": "BET-1",
	}
	for _, task := range tasks {
		if task.Key != wantKeys[task.ID] {
			t.Fatalf("task %s want key %q, got %q", task.ID, wantKeys[task.ID], task.Key)
		}
	}

	var ws1 WorkspaceModel
	if err := db.First(&ws1, "id = ?", "ws1").Error; err != nil {
		t.Fatalf("reload workspace 1: %v", err)
	}
	if ws1.TaskSeq != 2 {
		t.Fatalf("workspace 1 want task_seq 2, got %d", ws1.TaskSeq)
	}

	var ws2 WorkspaceModel
	if err := db.First(&ws2, "id = ?", "ws2").Error; err != nil {
		t.Fatalf("reload workspace 2: %v", err)
	}
	if ws2.TaskSeq != 1 {
		t.Fatalf("workspace 2 want task_seq 1, got %d", ws2.TaskSeq)
	}
}

func TestTaskRepositoryCreateDerivesMissingWorkspaceKeyPrefix(t *testing.T) {
	db := newTaskKeyDB(t)
	repo := NewTaskRepository(db)

	if err := db.Create(&WorkspaceModel{ID: "ws1", Name: "Roadmap Ops"}).Error; err != nil {
		t.Fatalf("create workspace: %v", err)
	}

	task := &entity.Task{ID: "task1", Task: "A", WorkspaceID: "ws1", OwnerID: "u1", Priority: "low", Status: string(domaintask.StatusTodo)}
	if err := repo.Create(context.Background(), task); err != nil {
		t.Fatalf("create task: %v", err)
	}
	if task.Key != "RO-1" {
		t.Fatalf("want derived key RO-1, got %q", task.Key)
	}

	var ws WorkspaceModel
	if err := db.First(&ws, "id = ?", "ws1").Error; err != nil {
		t.Fatalf("reload workspace: %v", err)
	}
	if ws.KeyPrefix != "RO" || ws.TaskSeq != 1 {
		t.Fatalf("want prefix RO seq 1, got prefix=%q seq=%d", ws.KeyPrefix, ws.TaskSeq)
	}
}
