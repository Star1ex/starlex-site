package repository

import (
	"context"
	"errors"
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	"gorm.io/gorm"
)

type SprintModel struct {
	ID          string `gorm:"primaryKey"`
	Name        string `gorm:"not null;default:''"`
	Goal        string `gorm:"not null;default:''"`
	WorkspaceID string `gorm:"not null;index:idx_sprint_workspace_status"`
	Status      string `gorm:"not null;default:'planning';index:idx_sprint_workspace_status"` // planning|active|completed|archived
	StartDate   *time.Time
	EndDate     *time.Time
	CreatedBy   string `gorm:"not null"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
	Tasks       []TaskModel `gorm:"foreignKey:SprintID"`
}

type SubtaskModel struct {
	ID        string `gorm:"primaryKey"`
	TaskID    string `gorm:"not null;index:idx_subtask_task"`
	Title     string `gorm:"not null"`
	IsDone    bool   `gorm:"not null;default:false"`
	Position  int    `gorm:"not null;default:0;index:idx_subtask_task"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

type SprintRepository struct {
	db *gorm.DB
}

func NewSprintRepository(db *gorm.DB) *SprintRepository {
	return &SprintRepository{db: db}
}

func toSprintDomain(m SprintModel) *entity.Sprint {
	return &entity.Sprint{
		ID:          m.ID,
		Name:        m.Name,
		Goal:        m.Goal,
		WorkspaceID: m.WorkspaceID,
		Status:      m.Status,
		StartDate:   m.StartDate,
		EndDate:     m.EndDate,
		CreatedBy:   m.CreatedBy,
		CreatedAt:   m.CreatedAt,
		UpdatedAt:   m.UpdatedAt,
		Tasks:       toTaskDomains(m.Tasks),
	}
}

func toSprintDomains(models []SprintModel) []*entity.Sprint {
	response := make([]*entity.Sprint, len(models))
	for i, sprint := range models {
		response[i] = toSprintDomain(sprint)
	}
	return response
}

func fromSprintDomain(s *entity.Sprint) *SprintModel {
	return &SprintModel{
		ID:          s.ID,
		Name:        s.Name,
		Goal:        s.Goal,
		WorkspaceID: s.WorkspaceID,
		Status:      s.Status,
		StartDate:   s.StartDate,
		EndDate:     s.EndDate,
		CreatedBy:   s.CreatedBy,
		CreatedAt:   s.CreatedAt,
		UpdatedAt:   s.UpdatedAt,
	}
}

func (r *SprintRepository) Create(ctx context.Context, sprint *entity.Sprint) error {
	return r.db.WithContext(ctx).Create(fromSprintDomain(sprint)).Error
}

func (r *SprintRepository) GetWorkspaceSprints(ctx context.Context, workspaceID string) ([]*entity.Sprint, error) {
	var models []SprintModel
	if err := r.db.WithContext(ctx).
		Where("workspace_id = ?", workspaceID).
		Order("created_at DESC").
		Find(&models).Error; err != nil {
		return nil, err
	}
	return toSprintDomains(models), nil
}

func (r *SprintRepository) GetByID(ctx context.Context, id string) (*entity.Sprint, error) {
	return r.getByID(ctx, id, "")
}

func (r *SprintRepository) GetByIDInWorkspace(ctx context.Context, id, workspaceID string) (*entity.Sprint, error) {
	return r.getByID(ctx, id, workspaceID)
}

func (r *SprintRepository) getByID(ctx context.Context, id, workspaceID string) (*entity.Sprint, error) {
	var model SprintModel
	query := r.db.WithContext(ctx).
		Preload("Tasks").
		Preload("Tasks.Assigned").
		Preload("Tasks.Subtasks").
		Where("id = ?", id)
	if workspaceID != "" {
		query = query.Where("workspace_id = ?", workspaceID)
	}
	result := query.First(&model)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, result.Error
	}
	return toSprintDomain(model), nil
}

func (r *SprintRepository) Update(ctx context.Context, sprint *entity.Sprint) error {
	return r.update(ctx, sprint, "")
}

func (r *SprintRepository) UpdateInWorkspace(ctx context.Context, sprint *entity.Sprint, workspaceID string) error {
	return r.update(ctx, sprint, workspaceID)
}

func (r *SprintRepository) update(ctx context.Context, sprint *entity.Sprint, workspaceID string) error {
	updates := map[string]interface{}{}
	if sprint.Name != "" {
		updates["name"] = sprint.Name
	}
	if sprint.Goal != "" {
		updates["goal"] = sprint.Goal
	}
	if sprint.StartDate != nil {
		updates["start_date"] = sprint.StartDate
	}
	if sprint.EndDate != nil {
		updates["end_date"] = sprint.EndDate
	}
	if sprint.Status != "" {
		updates["status"] = sprint.Status
	}
	if len(updates) == 0 {
		return nil
	}
	query := r.db.WithContext(ctx).Model(&SprintModel{}).
		Where("id = ?", sprint.ID)
	if workspaceID != "" {
		query = query.Where("workspace_id = ?", workspaceID)
	}
	result := query.Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *SprintRepository) Delete(ctx context.Context, id string) error {
	return r.delete(ctx, id, "")
}

func (r *SprintRepository) DeleteInWorkspace(ctx context.Context, id, workspaceID string) error {
	return r.delete(ctx, id, workspaceID)
}

func (r *SprintRepository) delete(ctx context.Context, id, workspaceID string) error {
	query := r.db.WithContext(ctx).Where("id = ?", id)
	if workspaceID != "" {
		query = query.Where("workspace_id = ?", workspaceID)
	}
	result := query.Delete(&SprintModel{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *SprintRepository) HasActiveSprint(ctx context.Context, workspaceID, excludeID string) (bool, error) {
	var count int64
	query := r.db.WithContext(ctx).Model(&SprintModel{}).
		Where("workspace_id = ? AND status = ?", workspaceID, "active")
	if excludeID != "" {
		query = query.Where("id <> ?", excludeID)
	}
	if err := query.Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *SprintRepository) CountTasks(ctx context.Context, sprintID string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&TaskModel{}).
		Where("sprint_id = ?", sprintID).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *SprintRepository) MoveIncompleteTasks(ctx context.Context, sprintID string, moveTarget *string) error {
	updates := map[string]interface{}{
		"sprint_id": moveTarget,
	}
	return r.db.WithContext(ctx).Model(&TaskModel{}).
		Where("sprint_id = ? AND progress <> ?", sprintID, "done").
		Updates(updates).Error
}

func (r *SprintRepository) UpdateTaskSprint(ctx context.Context, taskID, workspaceID string, sprintID *string) error {
	result := r.db.WithContext(ctx).Model(&TaskModel{}).
		Where("id = ? AND workspace_id = ?", taskID, workspaceID).
		Update("sprint_id", sprintID)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *SprintRepository) UpdateTaskPosition(ctx context.Context, taskID, workspaceID string, position int) error {
	result := r.db.WithContext(ctx).Model(&TaskModel{}).
		Where("id = ? AND workspace_id = ?", taskID, workspaceID).
		Update("position", position)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *SprintRepository) CreateSubtask(ctx context.Context, subtask *entity.Subtask) error {
	model := SubtaskModel{
		ID:       subtask.ID,
		TaskID:   subtask.TaskID,
		Title:    subtask.Title,
		IsDone:   subtask.IsDone,
		Position: subtask.Position,
	}
	return r.db.WithContext(ctx).Create(&model).Error
}

func (r *SprintRepository) CountSubtasks(ctx context.Context, taskID string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&SubtaskModel{}).
		Where("task_id = ?", taskID).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *SprintRepository) GetSubtask(ctx context.Context, id string) (*entity.Subtask, error) {
	return r.getSubtask(ctx, "", id)
}

func (r *SprintRepository) GetSubtaskForTask(ctx context.Context, taskID, id string) (*entity.Subtask, error) {
	return r.getSubtask(ctx, taskID, id)
}

func (r *SprintRepository) getSubtask(ctx context.Context, taskID, id string) (*entity.Subtask, error) {
	var model SubtaskModel
	query := r.db.WithContext(ctx).Where("id = ?", id)
	if taskID != "" {
		query = query.Where("task_id = ?", taskID)
	}
	result := query.First(&model)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, gorm.ErrRecordNotFound
		}
		return nil, result.Error
	}
	return toSubtaskDomain(model), nil
}

func (r *SprintRepository) UpdateSubtask(ctx context.Context, taskID, id string, updates map[string]interface{}) error {
	if len(updates) == 0 {
		return nil
	}
	result := r.db.WithContext(ctx).Model(&SubtaskModel{}).
		Where("id = ? AND task_id = ?", id, taskID).
		Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *SprintRepository) DeleteSubtask(ctx context.Context, taskID, id string) error {
	result := r.db.WithContext(ctx).
		Where("id = ? AND task_id = ?", id, taskID).
		Delete(&SubtaskModel{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *SprintRepository) SearchInWorkspaces(ctx context.Context, workspaceIDs []string, query string) ([]*entity.Sprint, error) {
	if len(workspaceIDs) == 0 || query == "" {
		return nil, nil
	}
	var models []SprintModel
	pattern := "%" + query + "%"
	err := r.db.WithContext(ctx).
		Where("workspace_id IN ? AND (name ILIKE ? OR goal ILIKE ?)", workspaceIDs, pattern, pattern).
		Limit(10).
		Find(&models).Error
	if err != nil {
		return nil, err
	}
	return toSprintDomains(models), nil
}
