package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	domainlabel "github.com/Star1ex/starlex-site/internal/domain/label"
	domaintask "github.com/Star1ex/starlex-site/internal/domain/task"
	domainworkspace "github.com/Star1ex/starlex-site/internal/domain/workspace"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// orderByPosition orders a preloaded association by its position column so
// subtasks are returned in a stable, user-defined order.
func orderByPosition(db *gorm.DB) *gorm.DB {
	return db.Order("position ASC")
}

func stringValue(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

type TaskModel struct {
	ID          string  `gorm:"primaryKey"`
	Key         *string `gorm:"uniqueIndex;default:null"`
	Task        string  `gorm:"not null"`
	Description string  `gorm:"not null"`
	Icon        string  `gorm:"not null;default:''"`
	Status      string  `gorm:"not null;default:'todo';index;index:idx_task_workspace_status,priority:2"`
	Priority    string  `gorm:"not null;index:idx_task_workspace_priority,priority:2"`
	Progress    string
	Assigned    []UserModel  `gorm:"many2many:task_users"`
	Labels      []LabelModel `gorm:"many2many:task_labels"`

	WorkspaceID *string        `gorm:"default:null;index:idx_task_workspace_updated,priority:1;index:idx_task_workspace_created,priority:1;index:idx_task_workspace_status,priority:1;index:idx_task_workspace_priority,priority:1;index:idx_task_workspace_project,priority:1;index:idx_task_workspace_sprint,priority:1;index:idx_task_workspace_due,priority:1"`
	OwnerID     string         `gorm:"not null;index"`
	SprintID    *string        `gorm:"default:null;index:idx_task_sprint;index:idx_task_workspace_sprint,priority:2"`
	ProjectID   *string        `gorm:"default:null;index:idx_task_project;index:idx_task_workspace_project,priority:2"`
	DueDate     *time.Time     `gorm:"default:null;index;index:idx_task_workspace_due,priority:2"`
	Position    int            `gorm:"not null;default:0"`
	Subtasks    []SubtaskModel `gorm:"foreignKey:TaskID"`
	CreatedAt   time.Time      `gorm:"index:idx_task_workspace_created,priority:2"`
	UpdatedAt   time.Time      `gorm:"index:idx_task_workspace_updated,priority:2"`
}

type TaskRepository struct {
	db *gorm.DB
}

var ErrStaleData = errors.New("stale task data")

func NewTaskRepository(db *gorm.DB) *TaskRepository {
	return &TaskRepository{
		db: db,
	}
}

func toTaskDomain(m TaskModel) *entity.Task {
	users := make([]*entity.User, len(m.Assigned))
	for i, u := range m.Assigned {
		user := toDomain(&u)
		users[i] = user
	}
	labels := make([]*domainlabel.Label, len(m.Labels))
	for i := range m.Labels {
		labels[i] = toLabelDomain(&m.Labels[i])
	}

	workspaceID := ""
	if m.WorkspaceID != nil {
		workspaceID = *m.WorkspaceID
	}

	return &entity.Task{
		ID:          m.ID,
		Key:         stringValue(m.Key),
		Task:        m.Task,
		Description: m.Description,
		Icon:        m.Icon,
		AssignedTo:  users,
		WorkspaceID: workspaceID,
		OwnerID:     m.OwnerID,
		SprintID:    m.SprintID,
		ProjectID:   m.ProjectID,
		DueDate:     m.DueDate,
		Position:    m.Position,
		Subtasks:    toSubtaskDomains(m.Subtasks),
		Status:      m.Status,
		Priority:    m.Priority,
		Progress:    m.Progress,
		Labels:      labels,
		CreatedAt:   m.CreatedAt,
		UpdatedAt:   m.UpdatedAt,
	}
}
func toTaskDomains(tasks []TaskModel) []*entity.Task {
	response := make([]*entity.Task, len(tasks))
	for i, task := range tasks {
		response[i] = toTaskDomain(task)
	}
	return response
}

func toSubtaskDomain(m SubtaskModel) *entity.Subtask {
	return &entity.Subtask{
		ID:        m.ID,
		TaskID:    m.TaskID,
		Title:     m.Title,
		IsDone:    m.IsDone,
		Position:  m.Position,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
}

func toSubtaskDomains(models []SubtaskModel) []*entity.Subtask {
	response := make([]*entity.Subtask, len(models))
	for i, subtask := range models {
		response[i] = toSubtaskDomain(subtask)
	}
	return response
}

func fromTaskDomain(t *entity.Task) *TaskModel {
	users := make([]UserModel, len(t.AssignedTo))
	for i, u := range t.AssignedTo {
		users[i] = *fromDomain(u)
	}
	var key *string
	if t.Key != "" {
		key = &t.Key
	}

	return &TaskModel{
		ID:          t.ID,
		Key:         key,
		Task:        t.Task,
		Description: t.Description,
		Icon:        t.Icon,
		Assigned:    users,
		Status:      t.Status,
		Priority:    t.Priority,
		Progress:    t.Progress,
		OwnerID:     t.OwnerID,
		SprintID:    t.SprintID,
		ProjectID:   t.ProjectID,
		DueDate:     t.DueDate,
		Position:    t.Position,
		WorkspaceID: &t.WorkspaceID,
		CreatedAt:   t.CreatedAt,
		UpdatedAt:   t.UpdatedAt,
	}
}

func (r *TaskRepository) Create(ctx context.Context, task *entity.Task) error {
	model := fromTaskDomain(task)
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if task.Status == "" {
			task.Status = string(domaintask.StatusTodo)
			model.Status = task.Status
		}
		if model.WorkspaceID != nil && *model.WorkspaceID != "" {
			key, err := r.nextWorkspaceTaskKey(ctx, tx, *model.WorkspaceID)
			if err != nil {
				return err
			}
			task.Key = key
			model.Key = &task.Key
		}
		return tx.WithContext(ctx).Create(model).Error
	})
}

func (r *TaskRepository) nextWorkspaceTaskKey(ctx context.Context, tx *gorm.DB, workspaceID string) (string, error) {
	var workspace WorkspaceModel
	if err := tx.WithContext(ctx).
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Select("id", "name", "key_prefix", "task_seq").
		First(&workspace, "id = ?", workspaceID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", ErrWorkspaceNotFound
		}
		return "", err
	}

	prefix := workspace.KeyPrefix
	if prefix == "" {
		prefix = domainworkspace.DeriveKeyPrefix(workspace.Name)
	}
	nextSeq := workspace.TaskSeq + 1
	if err := tx.WithContext(ctx).Model(&WorkspaceModel{}).
		Where("id = ?", workspaceID).
		Updates(map[string]interface{}{
			"key_prefix": prefix,
			"task_seq":   nextSeq,
		}).Error; err != nil {
		return "", err
	}
	return fmt.Sprintf("%s-%d", prefix, nextSeq), nil
}

func (r *TaskRepository) Get(ctx context.Context, id string) (*entity.Task, error) {
	var model TaskModel
	result := r.db.WithContext(ctx).
		Preload("Assigned").
		Preload("Labels").
		Preload("Subtasks", orderByPosition).
		Where("id = ?", id).
		First(&model)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, result.Error
	}
	return toTaskDomain(model), nil
}

func (r *TaskRepository) Update(ctx context.Context, id string, data *entity.Task, assigned []string) (*entity.Task, error) {
	var task TaskModel
	if err := r.db.WithContext(ctx).Preload("Assigned").Preload("Labels").Where("id = ?", id).First(&task).Error; err != nil {
		return nil, err
	}

	updates := map[string]interface{}{}
	if data.Task != "" {
		updates["task"] = data.Task
	}
	if data.Description != "" {
		updates["description"] = data.Description
	}
	if data.Priority != "" {
		updates["priority"] = data.Priority
	}
	if data.Progress != "" {
		updates["progress"] = data.Progress
	}
	if data.Status != "" {
		updates["status"] = data.Status
	}

	if len(updates) > 0 {
		expectedUpdatedAt := data.UpdatedAt
		if expectedUpdatedAt.IsZero() {
			expectedUpdatedAt = task.UpdatedAt
		}
		result := r.db.WithContext(ctx).
			Model(&TaskModel{}).
			Where("id = ? AND updated_at = ?", task.ID, expectedUpdatedAt).
			Updates(updates)
		if result.Error != nil {
			return nil, result.Error
		}
		if result.RowsAffected == 0 {
			return nil, ErrStaleData
		}
	}

	if assigned != nil {
		var users []UserModel
		if err := r.db.WithContext(ctx).Where("id IN ?", assigned).Find(&users).Error; err != nil {
			return nil, err
		}
		if err := r.db.WithContext(ctx).Model(&task).Association("Assigned").Replace(users); err != nil {
			return nil, err
		}
	}

	if err := r.db.WithContext(ctx).Preload("Assigned").Preload("Labels").Where("id = ?", id).First(&task).Error; err != nil {
		return nil, err
	}

	return toTaskDomain(task), nil
}

func (r *TaskRepository) UpdateIcon(ctx context.Context, id string, icon string) error {
	result := r.db.WithContext(ctx).Model(&TaskModel{}).Where("id = ?", id).Update("icon", icon)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *TaskRepository) UpdateTitle(ctx context.Context, id string, title string) error {
	result := r.db.WithContext(ctx).Model(&TaskModel{}).Where("id = ?", id).Update("task", title)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *TaskRepository) UpdateDescription(ctx context.Context, id string, description string) error {
	result := r.db.WithContext(ctx).Model(&TaskModel{}).Where("id = ?", id).Update("description", description)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *TaskRepository) UpdatePriority(ctx context.Context, id string, priority string) error {
	result := r.db.WithContext(ctx).Model(&TaskModel{}).Where("id = ?", id).Update("priority", priority)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *TaskRepository) UpdateProgress(ctx context.Context, id string, progress string) error {
	result := r.db.WithContext(ctx).Model(&TaskModel{}).Where("id = ?", id).Update("progress", progress)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *TaskRepository) UpdateStatus(ctx context.Context, id string, status string) error {
	result := r.db.WithContext(ctx).Model(&TaskModel{}).Where("id = ?", id).Update("status", status)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *TaskRepository) UpdateDueDate(ctx context.Context, id string, dueDate *time.Time) error {
	result := r.db.WithContext(ctx).Model(&TaskModel{}).Where("id = ?", id).Update("due_date", dueDate)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *TaskRepository) UpdateAssignees(ctx context.Context, id string, assigned []string) error {
	var task TaskModel
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&task).Error; err != nil {
		return err
	}

	var users []UserModel
	if len(assigned) > 0 {
		if err := r.db.WithContext(ctx).Where("id IN ?", assigned).Find(&users).Error; err != nil {
			return err
		}
	}

	if err := r.db.WithContext(ctx).Model(&task).Association("Assigned").Replace(users); err != nil {
		return err
	}

	return nil
}

func (r *TaskRepository) UpdateLabels(ctx context.Context, id string, labelIDs []string) error {
	var task TaskModel
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&task).Error; err != nil {
		return err
	}
	if task.WorkspaceID == nil || *task.WorkspaceID == "" {
		return domainlabel.ErrLabelNotFound
	}

	var labels []LabelModel
	if len(labelIDs) > 0 {
		if err := r.db.WithContext(ctx).
			Where("id IN ? AND workspace_id = ?", labelIDs, *task.WorkspaceID).
			Find(&labels).Error; err != nil {
			return err
		}
		if len(labels) != len(uniqueStrings(labelIDs)) {
			return domainlabel.ErrLabelNotFound
		}
	}

	if err := r.db.WithContext(ctx).Model(&task).Association("Labels").Replace(labels); err != nil {
		return err
	}
	return nil
}

func uniqueStrings(values []string) map[string]struct{} {
	out := make(map[string]struct{}, len(values))
	for _, value := range values {
		out[value] = struct{}{}
	}
	return out
}

func (r *TaskRepository) Delete(ctx context.Context, id string) error {
	var task TaskModel
	if err := r.db.WithContext(ctx).Preload("Assigned").Where("id = ?", id).First(&task).Error; err != nil {
		return err
	}
	if err := r.db.WithContext(ctx).Model(&task).Association("Assigned").Clear(); err != nil {
		return err
	}

	return r.db.WithContext(ctx).Delete(&task).Error
}

func (r *TaskRepository) GetWorkspaceTasks(ctx context.Context, workspaceID string) ([]*entity.Task, error) {
	var models []TaskModel

	err := r.db.WithContext(ctx).
		Preload("Assigned").
		Preload("Labels").
		Preload("Subtasks", orderByPosition).
		Where("workspace_id = ? AND sprint_id IS NULL", workspaceID).
		Find(&models).Error

	if err != nil {
		return nil, err
	}

	return toTaskDomains(models), nil
}

func (r *TaskRepository) GetProjectTasks(ctx context.Context, projectID string) ([]*entity.Task, error) {
	var models []TaskModel
	err := r.db.WithContext(ctx).
		Preload("Assigned").
		Preload("Labels").
		Preload("Subtasks", orderByPosition).
		Where("project_id = ?", projectID).
		Order("created_at DESC").
		Find(&models).Error
	if err != nil {
		return nil, err
	}
	return toTaskDomains(models), nil
}

func (r *TaskRepository) SearchInWorkspaces(ctx context.Context, workspaceIDs []string, query string) ([]*entity.Task, error) {
	if len(workspaceIDs) == 0 || query == "" {
		return nil, nil
	}
	var models []TaskModel
	pattern := "%" + query + "%"
	err := r.db.WithContext(ctx).
		Preload("Assigned").
		Preload("Labels").
		Where("workspace_id IN ? AND sprint_id IS NULL AND (task ILIKE ? OR description ILIKE ?)", workspaceIDs, pattern, pattern).
		Limit(10).
		Find(&models).Error
	if err != nil {
		return nil, err
	}
	return toTaskDomains(models), nil
}
