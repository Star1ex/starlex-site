package repository

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	domaintask "github.com/Star1ex/starlex-site/internal/domain/task"
	"gorm.io/gorm"
)

const noneCategoryID = "__none"

type categoryRow struct {
	ID    string
	Name  string
	Color string
	Count int
}

func (r *TaskRepository) QueryWorkspaceTasks(ctx context.Context, query domaintask.Query) (*domaintask.QueryResult, error) {
	db := r.db.WithContext(ctx).Model(&TaskModel{}).Where("task_models.workspace_id = ?", query.WorkspaceID)
	db = applyTaskFilters(db, query)
	db, err := applyTaskCursor(db, query)
	if err != nil {
		return nil, err
	}

	sortExpr := taskSortExpression(query.SortBy, query.Direction)
	db = db.Order(fmt.Sprintf("%s %s", sortExpr, sqlDirection(query.Direction))).
		Order(fmt.Sprintf("task_models.id %s", sqlDirection(query.Direction))).
		Limit(query.Limit + 1)

	var models []TaskModel
	if err := db.Preload("Assigned").
		Preload("Labels").
		Preload("Subtasks", orderByPosition).
		Find(&models).Error; err != nil {
		return nil, err
	}

	hasMore := len(models) > query.Limit
	if hasMore {
		models = models[:query.Limit]
	}
	tasks := toTaskDomains(models)
	var next *domaintask.QueryCursor
	if hasMore && len(tasks) > 0 {
		next = cursorFromTask(tasks[len(tasks)-1], query.SortBy, query.Direction)
	}
	return &domaintask.QueryResult{Tasks: tasks, NextCursor: next}, nil
}

func (r *TaskRepository) GetWorkspaceTaskCategories(
	ctx context.Context,
	workspaceID string,
) (*domaintask.WorkspaceTaskCategories, error) {
	categories := &domaintask.WorkspaceTaskCategories{}
	var err error
	if categories.Statuses, err = r.statusCategories(ctx, workspaceID); err != nil {
		return nil, err
	}
	if categories.Priorities, err = r.priorityCategories(ctx, workspaceID); err != nil {
		return nil, err
	}
	if categories.Projects, err = r.projectCategories(ctx, workspaceID); err != nil {
		return nil, err
	}
	if categories.Assignees, err = r.assigneeCategories(ctx, workspaceID); err != nil {
		return nil, err
	}
	if categories.Labels, err = r.labelCategories(ctx, workspaceID); err != nil {
		return nil, err
	}
	if categories.Due, err = r.dueCategories(ctx, workspaceID); err != nil {
		return nil, err
	}
	return categories, nil
}

func applyTaskFilters(db *gorm.DB, query domaintask.Query) *gorm.DB {
	if len(query.ProjectIDs) > 0 {
		db = applyNullableIDFilter(db, "task_models.project_id", query.ProjectIDs)
	}
	if len(query.SprintIDs) > 0 {
		db = applyNullableIDFilter(db, "task_models.sprint_id", query.SprintIDs)
	}
	if len(query.Statuses) > 0 {
		db = db.Where("task_models.status IN ?", query.Statuses)
	}
	if len(query.Priorities) > 0 {
		db = db.Where("task_models.priority IN ?", query.Priorities)
	}
	if len(query.AssigneeIDs) > 0 {
		db = db.Where(`EXISTS (
			SELECT 1 FROM task_users tu
			WHERE tu.task_model_id = task_models.id AND tu.user_model_id IN ?
		)`, query.AssigneeIDs)
	}
	if len(query.LabelIDs) > 0 {
		db = db.Where(`EXISTS (
			SELECT 1 FROM task_labels tl
			WHERE tl.task_model_id = task_models.id AND tl.label_model_id IN ?
		)`, query.LabelIDs)
	}
	if query.Search != "" {
		pattern := "%" + query.Search + "%"
		db = db.Where("(task_models.task ILIKE ? OR task_models.description ILIKE ? OR task_models.key ILIKE ?)", pattern, pattern, pattern)
	}
	if query.DueFrom != nil {
		db = db.Where("task_models.due_date >= ?", *query.DueFrom)
	}
	if query.DueTo != nil {
		db = db.Where("task_models.due_date <= ?", *query.DueTo)
	}
	return db
}

func applyNullableIDFilter(db *gorm.DB, column string, values []string) *gorm.DB {
	ids := make([]string, 0, len(values))
	includeNone := false
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value == "" || value == noneCategoryID {
			includeNone = true
			continue
		}
		ids = append(ids, value)
	}
	switch {
	case includeNone && len(ids) > 0:
		return db.Where(fmt.Sprintf("(%s IN ? OR %s IS NULL)", column, column), ids)
	case includeNone:
		return db.Where(fmt.Sprintf("%s IS NULL", column))
	default:
		return db.Where(fmt.Sprintf("%s IN ?", column), ids)
	}
}

func applyTaskCursor(db *gorm.DB, query domaintask.Query) (*gorm.DB, error) {
	if query.Cursor == nil || query.Cursor.ID == "" || query.Cursor.Value == "" {
		return db, nil
	}
	value, err := cursorValue(query.SortBy, query.Cursor.Value)
	if err != nil {
		return nil, err
	}
	op := "<"
	if query.Direction == domaintask.SortAsc {
		op = ">"
	}
	sortExpr := taskSortExpression(query.SortBy, query.Direction)
	return db.Where(
		fmt.Sprintf("(%s %s ? OR (%s = ? AND task_models.id %s ?))", sortExpr, op, sortExpr, op),
		value,
		value,
		query.Cursor.ID,
	), nil
}

func taskSortExpression(sortBy domaintask.SortField, direction domaintask.SortDirection) string {
	switch sortBy {
	case domaintask.SortCreatedAt:
		return "task_models.created_at"
	case domaintask.SortDueDate:
		if direction == domaintask.SortAsc {
			return "COALESCE(task_models.due_date, TIMESTAMP '9999-12-31')"
		}
		return "COALESCE(task_models.due_date, TIMESTAMP '0001-01-01')"
	case domaintask.SortPriority:
		return prioritySortExpression()
	case domaintask.SortStatus:
		return statusSortExpression()
	case domaintask.SortKey:
		return "COALESCE(task_models.key, '')"
	default:
		return "task_models.updated_at"
	}
}

func sqlDirection(direction domaintask.SortDirection) string {
	if direction == domaintask.SortAsc {
		return "ASC"
	}
	return "DESC"
}

func cursorValue(sortBy domaintask.SortField, value string) (interface{}, error) {
	switch sortBy {
	case domaintask.SortCreatedAt, domaintask.SortUpdatedAt, domaintask.SortDueDate:
		parsed, err := time.Parse(time.RFC3339Nano, value)
		if err != nil {
			return nil, err
		}
		return parsed, nil
	case domaintask.SortPriority:
		return strconv.Atoi(value)
	case domaintask.SortStatus:
		return strconv.Atoi(value)
	default:
		return value, nil
	}
}

func cursorFromTask(task *entity.Task, sortBy domaintask.SortField, direction domaintask.SortDirection) *domaintask.QueryCursor {
	value := task.UpdatedAt.Format(time.RFC3339Nano)
	switch sortBy {
	case domaintask.SortCreatedAt:
		value = task.CreatedAt.Format(time.RFC3339Nano)
	case domaintask.SortDueDate:
		if task.DueDate == nil {
			fallback := time.Date(9999, 12, 31, 0, 0, 0, 0, time.UTC)
			if direction == domaintask.SortDesc {
				fallback = time.Date(1, 1, 1, 0, 0, 0, 0, time.UTC)
			}
			value = fallback.Format(time.RFC3339Nano)
		} else {
			value = task.DueDate.Format(time.RFC3339Nano)
		}
	case domaintask.SortPriority:
		value = strconv.Itoa(priorityRank(task.Priority))
	case domaintask.SortStatus:
		value = strconv.Itoa(statusRank(task.Status))
	case domaintask.SortKey:
		value = task.Key
	}
	return &domaintask.QueryCursor{Value: value, ID: task.ID}
}

func prioritySortExpression() string {
	return `CASE task_models.priority
		WHEN 'urgent' THEN 5
		WHEN 'high' THEN 4
		WHEN 'medium' THEN 3
		WHEN 'low' THEN 2
		ELSE 1
	END`
}

func statusSortExpression() string {
	return `CASE task_models.status
		WHEN 'backlog' THEN 1
		WHEN 'todo' THEN 2
		WHEN 'in_progress' THEN 3
		WHEN 'in_review' THEN 4
		WHEN 'done' THEN 5
		WHEN 'canceled' THEN 6
		ELSE 0
	END`
}

func priorityRank(priority string) int {
	switch priority {
	case "urgent":
		return 5
	case "high":
		return 4
	case "medium":
		return 3
	case "low":
		return 2
	default:
		return 1
	}
}

func statusRank(status string) int {
	switch status {
	case "backlog":
		return 1
	case "todo":
		return 2
	case "in_progress":
		return 3
	case "in_review":
		return 4
	case "done":
		return 5
	case "canceled":
		return 6
	default:
		return 0
	}
}

func (r *TaskRepository) statusCategories(ctx context.Context, workspaceID string) ([]domaintask.CategoryItem, error) {
	var rows []categoryRow
	err := r.db.WithContext(ctx).Model(&TaskModel{}).
		Select("status AS id, status AS name, COUNT(*) AS count").
		Where("workspace_id = ?", workspaceID).
		Group("status").
		Order(statusSortExpression()).
		Scan(&rows).Error
	return toCategoryItems(rows), err
}

func (r *TaskRepository) priorityCategories(ctx context.Context, workspaceID string) ([]domaintask.CategoryItem, error) {
	var rows []categoryRow
	err := r.db.WithContext(ctx).Model(&TaskModel{}).
		Select("priority AS id, priority AS name, COUNT(*) AS count").
		Where("workspace_id = ?", workspaceID).
		Group("priority").
		Order(prioritySortExpression() + " DESC").
		Scan(&rows).Error
	return toCategoryItems(rows), err
}

func (r *TaskRepository) projectCategories(ctx context.Context, workspaceID string) ([]domaintask.CategoryItem, error) {
	var rows []categoryRow
	err := r.db.WithContext(ctx).Table("task_models t").
		Select("COALESCE(p.id, ?) AS id, COALESCE(p.name, 'No project') AS name, COUNT(*) AS count", noneCategoryID).
		Joins("LEFT JOIN project_models p ON p.id = t.project_id").
		Where("t.workspace_id = ?", workspaceID).
		Group("p.id, p.name").
		Order("name ASC").
		Scan(&rows).Error
	return toCategoryItems(rows), err
}

func (r *TaskRepository) assigneeCategories(ctx context.Context, workspaceID string) ([]domaintask.CategoryItem, error) {
	var rows []categoryRow
	err := r.db.WithContext(ctx).Table("task_models t").
		Select("u.id AS id, CONCAT(u.first_name, ' ', u.last_name) AS name, COUNT(*) AS count").
		Joins("JOIN task_users tu ON tu.task_model_id = t.id").
		Joins("JOIN user_models u ON u.id = tu.user_model_id").
		Where("t.workspace_id = ?", workspaceID).
		Group("u.id, u.first_name, u.last_name").
		Order("name ASC").
		Scan(&rows).Error
	return toCategoryItems(rows), err
}

func (r *TaskRepository) labelCategories(ctx context.Context, workspaceID string) ([]domaintask.CategoryItem, error) {
	var rows []categoryRow
	err := r.db.WithContext(ctx).Table("task_models t").
		Select("l.id AS id, l.name AS name, l.color AS color, COUNT(*) AS count").
		Joins("JOIN task_labels tl ON tl.task_model_id = t.id").
		Joins("JOIN label_models l ON l.id = tl.label_model_id").
		Where("t.workspace_id = ?", workspaceID).
		Group("l.id, l.name, l.color").
		Order("l.name ASC").
		Scan(&rows).Error
	return toCategoryItems(rows), err
}

func (r *TaskRepository) dueCategories(ctx context.Context, workspaceID string) ([]domaintask.CategoryItem, error) {
	var rows []categoryRow
	err := r.db.WithContext(ctx).Table("task_models").
		Select(`CASE
			WHEN due_date IS NULL THEN 'none'
			WHEN due_date < CURRENT_DATE THEN 'overdue'
			WHEN due_date < CURRENT_DATE + INTERVAL '1 day' THEN 'today'
			WHEN due_date < CURRENT_DATE + INTERVAL '7 days' THEN 'next_7_days'
			ELSE 'later'
		END AS id,
		CASE
			WHEN due_date IS NULL THEN 'No due date'
			WHEN due_date < CURRENT_DATE THEN 'Overdue'
			WHEN due_date < CURRENT_DATE + INTERVAL '1 day' THEN 'Today'
			WHEN due_date < CURRENT_DATE + INTERVAL '7 days' THEN 'Next 7 days'
			ELSE 'Later'
		END AS name,
		COUNT(*) AS count`).
		Where("workspace_id = ?", workspaceID).
		Group("id, name").
		Order(`CASE id
			WHEN 'overdue' THEN 1
			WHEN 'today' THEN 2
			WHEN 'next_7_days' THEN 3
			WHEN 'later' THEN 4
			ELSE 5
		END`).
		Scan(&rows).Error
	return toCategoryItems(rows), err
}

func toCategoryItems(rows []categoryRow) []domaintask.CategoryItem {
	items := make([]domaintask.CategoryItem, len(rows))
	for i, row := range rows {
		items[i] = domaintask.CategoryItem{
			ID:    row.ID,
			Name:  strings.TrimSpace(row.Name),
			Color: row.Color,
			Count: row.Count,
		}
		if items[i].Name == "" {
			items[i].Name = row.ID
		}
	}
	return items
}
