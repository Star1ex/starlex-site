package service

import (
	"context"
	"errors"
	"testing"

	"github.com/Star1ex/starlex-site/internal/repository"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func sprintStringPtr(value string) *string {
	return &value
}

func newSprintServiceAccessDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open sqlite db: %v", err)
	}
	if err := db.AutoMigrate(
		&repository.UserModel{},
		&repository.WorkspaceModel{},
		&repository.TaskModel{},
		&repository.SprintModel{},
		&repository.SubtaskModel{},
	); err != nil {
		t.Fatalf("migrate test db: %v", err)
	}
	return db
}

func TestSprintServiceMoveTaskRejectsCrossWorkspaceSprint(t *testing.T) {
	db := newSprintServiceAccessDB(t)
	service := NewSprintService(repository.NewSprintRepository(db))

	if err := db.Create(&repository.WorkspaceModel{ID: "ws1", Name: "Alpha", KeyPrefix: "ALP"}).Error; err != nil {
		t.Fatalf("create workspace 1: %v", err)
	}
	if err := db.Create(&repository.WorkspaceModel{ID: "ws2", Name: "Beta", KeyPrefix: "BET"}).Error; err != nil {
		t.Fatalf("create workspace 2: %v", err)
	}
	if err := db.Create(&repository.TaskModel{ID: "task1", Task: "A", WorkspaceID: sprintStringPtr("ws1"), OwnerID: "u1", Priority: "low", Status: "todo"}).Error; err != nil {
		t.Fatalf("create task: %v", err)
	}
	if err := db.Create(&repository.SprintModel{ID: "sprint-ws2", WorkspaceID: "ws2", Name: "Beta sprint", CreatedBy: "u2"}).Error; err != nil {
		t.Fatalf("create sprint: %v", err)
	}

	target := "sprint-ws2"
	err := service.MoveTaskToSprint(context.Background(), "task1", "ws1", &target)
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("want record not found for cross-workspace sprint, got %v", err)
	}

	var task repository.TaskModel
	if err := db.First(&task, "id = ?", "task1").Error; err != nil {
		t.Fatalf("reload task: %v", err)
	}
	if task.SprintID != nil {
		t.Fatalf("task should not be moved across workspaces, sprint_id=%q", *task.SprintID)
	}
}

func TestSprintServiceDeleteSprintScopesByWorkspace(t *testing.T) {
	db := newSprintServiceAccessDB(t)
	service := NewSprintService(repository.NewSprintRepository(db))

	if err := db.Create(&repository.WorkspaceModel{ID: "ws1", Name: "Alpha", KeyPrefix: "ALP"}).Error; err != nil {
		t.Fatalf("create workspace 1: %v", err)
	}
	if err := db.Create(&repository.WorkspaceModel{ID: "ws2", Name: "Beta", KeyPrefix: "BET"}).Error; err != nil {
		t.Fatalf("create workspace 2: %v", err)
	}
	if err := db.Create(&repository.SprintModel{ID: "sprint-ws2", WorkspaceID: "ws2", Name: "Beta sprint", CreatedBy: "u2"}).Error; err != nil {
		t.Fatalf("create sprint: %v", err)
	}

	err := service.DeleteSprint(context.Background(), "sprint-ws2", "ws1")
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("want record not found for wrong workspace, got %v", err)
	}

	var count int64
	if err := db.Model(&repository.SprintModel{}).Where("id = ?", "sprint-ws2").Count(&count).Error; err != nil {
		t.Fatalf("count sprint: %v", err)
	}
	if count != 1 {
		t.Fatalf("sprint should not be deleted through wrong workspace, count=%d", count)
	}
}
