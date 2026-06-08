package repository

import (
	"context"
	"testing"

	domaintask "github.com/Star1ex/starlex-site/internal/domain/task"
)

func TestTaskRepositoryQueryWorkspaceTasksBuildsIndexedFilterSQL(t *testing.T) {
	capture := &sqlCaptureLogger{}
	repo := NewTaskRepository(newDryRunDB(t, capture))

	_, err := repo.QueryWorkspaceTasks(context.Background(), domaintask.Query{
		WorkspaceID: "ws-1",
		Statuses:    []string{"todo", "in_review"},
		AssigneeIDs: []string{"u-1"},
		LabelIDs:    []string{"l-1"},
		SortBy:      domaintask.SortUpdatedAt,
		Direction:   domaintask.SortDesc,
		Limit:       50,
	})
	if err != nil {
		t.Fatalf("query workspace tasks: %v", err)
	}

	assertSQLContains(
		t,
		capture.sql,
		`FROM "task_models"`,
		`task_models.workspace_id = 'ws-1'`,
		`task_models.status IN ('todo','in_review')`,
		`EXISTS`,
		`task_users`,
		`task_labels`,
		`ORDER BY task_models.updated_at DESC`,
		`LIMIT 51`,
	)
}
