package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	taskdomain "github.com/Star1ex/starlex-site/internal/domain/task"
	"github.com/Star1ex/starlex-site/internal/domain/user"
	"github.com/Star1ex/starlex-site/internal/domain/workspace"
	"github.com/Star1ex/starlex-site/internal/events"
	"github.com/google/uuid"
)

type TaskService struct {
	taskRepo      taskdomain.Repository
	userRepo      user.Repository
	workspaceRepo workspace.Repository
	bus           *events.Bus
}

func NewTaskService(taskRepo taskdomain.Repository, userRepo user.Repository, workspaceRepo workspace.Repository, bus ...*events.Bus) *TaskService {
	service := &TaskService{
		taskRepo:      taskRepo,
		userRepo:      userRepo,
		workspaceRepo: workspaceRepo,
	}
	if len(bus) > 0 {
		service.bus = bus[0]
	}
	return service
}

func (s *TaskService) CreateWorkspaceTask(
	ctx context.Context,
	workspaceID string,
	assignedIDs []string,
	task *entity.Task,
	userId string,
) error {
	if workspaceID == "" {
		return errors.New("workspace id is required")
	}

	// Ensure the workspace exists. Membership authorization is enforced by the
	// API layer (any workspace member may create tasks).
	workspaceEntity, err := s.workspaceRepo.GetWorkspaceByID(ctx, workspaceID)
	if err != nil {
		return err
	}

	// Handle assigned users - can be empty array
	var users []*entity.User
	if len(assignedIDs) > 0 {
		var err error
		users, err = s.userRepo.GetByIDs(ctx, assignedIDs)
		if err != nil {
			return err
		}
	}
	// If assignedIDs is empty, users will be nil/empty, which is valid
	status, err := parseTaskStatusWithWorkspaceDefault(task.Status, workspaceEntity)
	if err != nil {
		return err
	}

	task.AssignedTo = users
	task.WorkspaceID = workspaceID
	task.OwnerID = userId
	task.ID = uuid.New().String()
	task.Status = string(status)

	if err := s.taskRepo.Create(ctx, task); err != nil {
		return err
	}
	s.publishTaskEvent("task.created", task, userId)
	return nil
}

// CreateProjectTask creates a task attached to a project. Project membership
// must be verified by the caller; the task inherits the project's workspace.
func (s *TaskService) CreateProjectTask(
	ctx context.Context,
	projectID, workspaceID string,
	assignedIDs []string,
	task *entity.Task,
) error {
	var users []*entity.User
	if len(assignedIDs) > 0 {
		var err error
		users, err = s.userRepo.GetByIDs(ctx, assignedIDs)
		if err != nil {
			return err
		}
	}
	workspaceEntity, err := s.workspaceRepo.GetWorkspaceByID(ctx, workspaceID)
	if err != nil {
		return err
	}
	status, err := parseTaskStatusWithWorkspaceDefault(task.Status, workspaceEntity)
	if err != nil {
		return err
	}
	pid := projectID
	task.AssignedTo = users
	task.WorkspaceID = workspaceID
	task.ProjectID = &pid
	task.ID = uuid.New().String()
	task.Status = string(status)
	if err := s.taskRepo.Create(ctx, task); err != nil {
		return err
	}
	s.publishTaskEvent("task.created", task, "")
	return nil
}

func (s *TaskService) GetProjectTasks(ctx context.Context, projectID string) ([]*entity.Task, error) {
	return s.taskRepo.GetProjectTasks(ctx, projectID)
}

func (s *TaskService) GetTaskByID(ctx context.Context, taskID string) (*entity.Task, error) {
	return s.taskRepo.Get(ctx, taskID)
}

func (s *TaskService) Update(ctx context.Context, id string, data *entity.Task, assignedTo []string) (*entity.Task, error) {
	if data.Status != "" {
		status, err := taskdomain.ParseStatus(data.Status)
		if err != nil {
			return nil, err
		}
		data.Status = string(status)
	}
	updated, err := s.taskRepo.Update(ctx, id, data, assignedTo)
	if err != nil {
		return nil, err
	}
	s.publishTaskEvent("task.updated", updated, "")
	return updated, nil
}

func (s *TaskService) GetWorkspaceTasks(ctx context.Context, workspaceID string) ([]*entity.Task, error) {
	tasks, err := s.taskRepo.GetWorkspaceTasks(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	return tasks, nil
}

func (s *TaskService) UpdateTaskProgress(ctx context.Context, taskID, progress string) (*entity.Task, error) {
	if err := s.taskRepo.UpdateProgress(ctx, taskID, progress); err != nil {
		return nil, err
	}
	updated, err := s.taskRepo.Get(ctx, taskID)
	if err != nil {
		return nil, err
	}
	s.publishTaskEvent("task.updated", updated, "")
	return updated, nil
}

func (s *TaskService) UpdateTaskIcon(ctx context.Context, taskID, icon string) error {
	if err := s.taskRepo.UpdateIcon(ctx, taskID, icon); err != nil {
		return err
	}
	return s.publishTaskUpdated(ctx, taskID)
}

func (s *TaskService) UpdateTaskTitle(ctx context.Context, taskID, title string) error {
	if err := s.taskRepo.UpdateTitle(ctx, taskID, title); err != nil {
		return err
	}
	return s.publishTaskUpdated(ctx, taskID)
}

func (s *TaskService) UpdateTaskDescription(ctx context.Context, taskID, description string) error {
	if err := s.taskRepo.UpdateDescription(ctx, taskID, description); err != nil {
		return err
	}
	return s.publishTaskUpdated(ctx, taskID)
}

func (s *TaskService) UpdateTaskPriority(ctx context.Context, taskID, priority string) error {
	if err := s.taskRepo.UpdatePriority(ctx, taskID, priority); err != nil {
		return err
	}
	return s.publishTaskUpdated(ctx, taskID)
}

func (s *TaskService) UpdateTaskStatus(ctx context.Context, taskID, statusValue string) error {
	status, err := taskdomain.ParseStatus(statusValue)
	if err != nil {
		return err
	}
	if err := s.taskRepo.UpdateStatus(ctx, taskID, string(status)); err != nil {
		return err
	}
	return s.publishTaskUpdated(ctx, taskID)
}

func (s *TaskService) UpdateTaskDueDate(ctx context.Context, taskID string, dueDate *time.Time) error {
	if err := s.taskRepo.UpdateDueDate(ctx, taskID, dueDate); err != nil {
		return err
	}
	return s.publishTaskUpdated(ctx, taskID)
}

func (s *TaskService) UpdateTaskAssignees(ctx context.Context, taskID string, assignedTo []string) error {
	if err := s.taskRepo.UpdateAssignees(ctx, taskID, assignedTo); err != nil {
		return err
	}
	return s.publishTaskUpdated(ctx, taskID)
}

func (s *TaskService) UpdateTaskLabels(ctx context.Context, taskID string, labelIDs []string) error {
	if err := s.taskRepo.UpdateLabels(ctx, taskID, labelIDs); err != nil {
		return err
	}
	return s.publishTaskUpdated(ctx, taskID)
}

func (s *TaskService) Delete(ctx context.Context, id string) error {
	var taskEntity *entity.Task
	if s.bus != nil {
		taskEntity, _ = s.taskRepo.Get(ctx, id)
	}
	if err := s.taskRepo.Delete(ctx, id); err != nil {
		return err
	}
	s.publishTaskEvent("task.deleted", taskEntity, "")
	return nil
}

func (s *TaskService) SearchInWorkspaces(ctx context.Context, workspaceIDs []string, query string) ([]*entity.Task, error) {
	return s.taskRepo.SearchInWorkspaces(ctx, workspaceIDs, query)
}

func parseTaskStatusWithWorkspaceDefault(status string, workspaceEntity *entity.Workspace) (taskdomain.Status, error) {
	status = strings.TrimSpace(status)
	if status == "" && workspaceEntity != nil {
		status = workspaceEntity.DefaultTaskStatus
	}
	return taskdomain.ParseStatus(status)
}

func (s *TaskService) publishTaskUpdated(ctx context.Context, taskID string) error {
	if s.bus == nil {
		return nil
	}
	taskEntity, err := s.taskRepo.Get(ctx, taskID)
	if err != nil {
		return err
	}
	s.publishTaskEvent("task.updated", taskEntity, "")
	return nil
}

func (s *TaskService) publishTaskEvent(eventType string, taskEntity *entity.Task, actorID string) {
	if s.bus == nil || taskEntity == nil || taskEntity.WorkspaceID == "" {
		return
	}
	s.bus.Publish(events.WorkspaceMutationEvent{
		Type:        eventType,
		WorkspaceID: taskEntity.WorkspaceID,
		ActorID:     actorID,
		OccurredAt:  time.Now().UTC(),
		Payload: map[string]string{
			"task_id": taskEntity.ID,
			"key":     taskEntity.Key,
		},
	})
}
