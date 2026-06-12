package repository

import (
	"context"
	"errors"
	"testing"

	"gorm.io/gorm"
)

func stringPtr(value string) *string {
	return &value
}

func TestSprintRepositorySubtaskMutationsRequireParentTask(t *testing.T) {
	db := newTaskKeyDB(t)
	repo := NewSprintRepository(db)

	if err := db.Create(&WorkspaceModel{ID: "ws1", Name: "Alpha", KeyPrefix: "ALP"}).Error; err != nil {
		t.Fatalf("create workspace: %v", err)
	}
	if err := db.Create(&TaskModel{ID: "task1", Task: "A", WorkspaceID: stringPtr("ws1"), OwnerID: "u1", Priority: "low", Status: "todo"}).Error; err != nil {
		t.Fatalf("create task 1: %v", err)
	}
	if err := db.Create(&TaskModel{ID: "task2", Task: "B", WorkspaceID: stringPtr("ws1"), OwnerID: "u1", Priority: "low", Status: "todo"}).Error; err != nil {
		t.Fatalf("create task 2: %v", err)
	}
	if err := db.Create(&SubtaskModel{ID: "sub1", TaskID: "task1", Title: "Original"}).Error; err != nil {
		t.Fatalf("create subtask: %v", err)
	}

	err := repo.UpdateSubtask(context.Background(), "task2", "sub1", map[string]interface{}{"title": "Wrong"})
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("want record not found updating through wrong task, got %v", err)
	}
	subtask, err := repo.GetSubtaskForTask(context.Background(), "task1", "sub1")
	if err != nil {
		t.Fatalf("reload subtask: %v", err)
	}
	if subtask.Title != "Original" {
		t.Fatalf("subtask title should not change through wrong task, got %q", subtask.Title)
	}

	err = repo.DeleteSubtask(context.Background(), "task2", "sub1")
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		t.Fatalf("want record not found deleting through wrong task, got %v", err)
	}
	if _, err := repo.GetSubtaskForTask(context.Background(), "task1", "sub1"); err != nil {
		t.Fatalf("subtask should still exist: %v", err)
	}
}
