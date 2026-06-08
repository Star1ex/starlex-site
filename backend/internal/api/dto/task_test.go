package dto

import (
	"testing"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
)

func TestToTaskResponse_IncludesSubtasks(t *testing.T) {
	task := &entity.Task{
		ID:          "t1",
		Task:        "Parent",
		WorkspaceID: "ws1",
		Subtasks: []*entity.Subtask{
			{ID: "s1", TaskID: "t1", Title: "first", IsDone: true, Position: 0},
			{ID: "s2", TaskID: "t1", Title: "second", IsDone: false, Position: 1},
		},
	}

	resp := ToTaskResponse(task)

	if len(resp.Subtasks) != 2 {
		t.Fatalf("want 2 subtasks in response, got %d", len(resp.Subtasks))
	}
	if resp.Subtasks[0].ID != "s1" || !resp.Subtasks[0].IsDone {
		t.Errorf("first subtask not mapped correctly: %+v", resp.Subtasks[0])
	}
	if resp.Subtasks[1].Title != "second" || resp.Subtasks[1].Position != 1 {
		t.Errorf("second subtask not mapped correctly: %+v", resp.Subtasks[1])
	}
}

func TestToTaskResponse_NoSubtasks(t *testing.T) {
	resp := ToTaskResponse(&entity.Task{ID: "t1", Task: "Lonely"})
	if resp.Subtasks == nil {
		t.Error("subtasks should be a non-nil empty slice for stable JSON output")
	}
	if len(resp.Subtasks) != 0 {
		t.Errorf("want 0 subtasks, got %d", len(resp.Subtasks))
	}
}

func TestToTaskResponse_AssigneesAreFullUsers(t *testing.T) {
	task := &entity.Task{
		ID:   "t1",
		Task: "Assigned",
		AssignedTo: []*entity.User{
			{ID: "u1", Email: "u1@example.com", FirstName: "Ada", LastName: "Lovelace", Role: "member"},
		},
	}

	resp := ToTaskResponse(task)
	if len(resp.Assignees) != 1 {
		t.Fatalf("want 1 assignee, got %d", len(resp.Assignees))
	}
	assignee := resp.Assignees[0]
	if assignee.ID != "u1" || assignee.Email != "u1@example.com" || assignee.FirstName != "Ada" {
		t.Fatalf("assignee not mapped as full user: %#v", assignee)
	}
}
