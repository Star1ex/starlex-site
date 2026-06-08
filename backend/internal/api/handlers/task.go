package handlers

import (
	"encoding/json"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/Star1ex/starlex-site/internal/api/dto"
	"github.com/Star1ex/starlex-site/internal/domain/entity"
	domaintask "github.com/Star1ex/starlex-site/internal/domain/task"
	"github.com/Star1ex/starlex-site/internal/logger"
	"github.com/Star1ex/starlex-site/internal/repository"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// Swagger disabled: CreateTask godoc
// Swagger disabled: Summary      Create task
// Swagger disabled: Description  Creates a new task within the specified workspace. Requires JWT authentication.
// Swagger disabled: Tags         tasks
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Param        workspace_id         path      string       true   "Workspace ID"
// Swagger disabled: Param        task_data       body      dto.TaskApi  true   "Task data"
// Swagger disabled: Success      201  {object}   map[string]interface{}    "Task created successfully"
// Swagger disabled: Failure      400  {object}   map[string]string         "Bad request or invalid JSON"
// Swagger disabled: Failure      401  {object}   map[string]string         "User not authorized"
// Swagger disabled: Failure      500  {object}   map[string]string         "Internal server error"
// Swagger disabled: Security BearerAuth
// Swagger disabled: Router       /workspace/{workspace_id}/tasks [post]
func (h *Handlers) CreateWorkspaceTask(ctx *fiber.Ctx) error {
	workspaceID := ctx.Params("workspace_id")
	if workspaceID == "" || workspaceID == "nil" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "workspace ID is required in URL"})
	}

	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	// Any member of the workspace may create tasks.
	if err := h.requireWorkspaceMember(ctx, workspaceID, userID); err != nil {
		return err
	}
	var input dto.TaskApi
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad json"})
	}

	input.Task = sanitizeStrict(input.Task)
	input.Description = sanitizeMarkdown(input.Description)

	entityTask := &entity.Task{
		Task:        input.Task,
		Description: input.Description,
		Status:      input.Status,
		Priority:    input.Priority,
		Progress:    input.Progress,
	}

	err := h.taskService.CreateWorkspaceTask(ctx.Context(), workspaceID, input.AssignedToID, entityTask, userID)

	if err != nil {
		logger.Log.Errorw("create workspace task failed", "error", err)
		return ctx.Status(500).JSON(fiber.Map{"error": "internal server error"})
	}

	// Return the created task so frontend can add it to the list
	// Fetch it back to get the full data with assigned users loaded
	createdTask, fetchErr := h.taskService.GetTaskByID(ctx.Context(), entityTask.ID)
	if fetchErr != nil {
		// If fetch fails, return basic task info
		logger.Log.Warnw("Failed to fetch created task", "error", fetchErr)
		return ctx.Status(201).JSON(dto.ToTaskResponse(entityTask))
	}

	return ctx.Status(201).JSON(dto.ToTaskResponse(createdTask))
}

func (h *Handlers) UpdateTask(c *fiber.Ctx) error {
	taskID := c.Params("id")

	userID, authErr := h.getAuthenticatedUserID(c)
	if authErr != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}
	if _, err := h.requireTaskAccess(c, taskID, userID); err != nil {
		return err
	}

	var updateTask dto.UpdateTask
	if err := c.BodyParser(&updateTask); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid json",
		})
	}

	updateTask.Task = sanitizeStrict(updateTask.Task)
	updateTask.Description = sanitizeMarkdown(updateTask.Description)

	taskEntity, assignedTo := dto.FromUpdateTask(&updateTask)

	updatedTask, err := h.taskService.Update(
		c.Context(),
		taskID,
		taskEntity,
		assignedTo,
	)

	if err != nil {
		if errors.Is(err, repository.ErrStaleData) {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "task was modified by someone else, please refresh",
			})
		}
		logger.Log.Errorw("update task failed", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	return c.JSON(updatedTask)
}

func (h *Handlers) PatchTaskIcon(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	taskID := ctx.Params("id")
	if taskID == "" || taskID == "nil" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "task ID is required in URL"})
	}
	if _, err := h.requireTaskAccess(ctx, taskID, userID); err != nil {
		return err
	}

	var input dto.UpdateTaskIcon
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad json"})
	}
	if input.Icon == nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "icon field is required"})
	}

	if err := h.taskService.UpdateTaskIcon(ctx.Context(), taskID, *input.Icon); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "task not found"})
		}
		logger.Log.Errorw("update task icon failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}

	return ctx.SendStatus(fiber.StatusNoContent)
}

func (h *Handlers) PatchTaskTitle(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	taskID := ctx.Params("id")
	if taskID == "" || taskID == "nil" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "task ID is required in URL"})
	}
	if _, err := h.requireTaskAccess(ctx, taskID, userID); err != nil {
		return err
	}

	var input dto.UpdateTaskTitle
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad json"})
	}
	if input.Task == nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "task field is required"})
	}
	title := strings.TrimSpace(*input.Task)
	if title == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "task title cannot be empty"})
	}

	if err := h.taskService.UpdateTaskTitle(ctx.Context(), taskID, title); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "task not found"})
		}
		logger.Log.Errorw("update task title failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}

	return ctx.SendStatus(fiber.StatusNoContent)
}

func (h *Handlers) PatchTaskDescription(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	taskID := ctx.Params("id")
	if taskID == "" || taskID == "nil" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "task ID is required in URL"})
	}
	if _, err := h.requireTaskAccess(ctx, taskID, userID); err != nil {
		return err
	}

	var input dto.UpdateTaskDescription
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad json"})
	}
	if input.Description == nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "description field is required"})
	}

	if err := h.taskService.UpdateTaskDescription(ctx.Context(), taskID, *input.Description); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "task not found"})
		}
		logger.Log.Errorw("update task description failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}

	return ctx.SendStatus(fiber.StatusNoContent)
}

func (h *Handlers) PatchTaskPriority(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	taskID := ctx.Params("id")
	if taskID == "" || taskID == "nil" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "task ID is required in URL"})
	}
	if _, err := h.requireTaskAccess(ctx, taskID, userID); err != nil {
		return err
	}

	var input dto.UpdateTaskPriority
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad json"})
	}
	if input.Priority == nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "priority field is required"})
	}

	priorityValue := strings.TrimSpace(*input.Priority)
	if priorityValue != "low" && priorityValue != "medium" && priorityValue != "high" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid priority"})
	}

	if err := h.taskService.UpdateTaskPriority(ctx.Context(), taskID, priorityValue); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "task not found"})
		}
		logger.Log.Errorw("update task priority failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}

	return ctx.SendStatus(fiber.StatusNoContent)
}

func (h *Handlers) PatchTaskProgress(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	taskID := ctx.Params("id")
	if taskID == "" || taskID == "nil" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "task ID is required in URL"})
	}
	if _, err := h.requireTaskAccess(ctx, taskID, userID); err != nil {
		return err
	}

	var input dto.UpdateTaskProgress
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad json"})
	}
	if input.Progress == nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "progress field is required"})
	}

	progressValue := strings.TrimSpace(*input.Progress)
	if progressValue != "not_started" && progressValue != "in_progress" && progressValue != "done" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad task progress"})
	}

	if _, err := h.taskService.UpdateTaskProgress(ctx.Context(), taskID, progressValue); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "task not found"})
		}
		logger.Log.Errorw("update task progress failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}

	return ctx.SendStatus(fiber.StatusNoContent)
}

// PatchTaskStatus godoc
// @Summary      Update task status
// @Description  Updates the status field of an existing task.
// @Tags         tasks
// @Accept       json
// @Produce      json
// @Param        id      path  string                true  "Task ID"
// @Param        status  body  dto.UpdateTaskStatus  true  "Task status"
// @Success      204
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Security     BearerAuth
// @Router       /tasks/{id}/status [patch]
func (h *Handlers) PatchTaskStatus(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	taskID := ctx.Params("id")
	if taskID == "" || taskID == "nil" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "task ID is required in URL"})
	}
	if _, err := h.requireTaskAccess(ctx, taskID, userID); err != nil {
		return err
	}

	var input dto.UpdateTaskStatus
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad json"})
	}
	if input.Status == nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "status field is required"})
	}

	statusValue := strings.TrimSpace(*input.Status)
	if err := h.taskService.UpdateTaskStatus(ctx.Context(), taskID, statusValue); err != nil {
		switch {
		case errors.Is(err, domaintask.ErrInvalidStatus):
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid status"})
		case errors.Is(err, gorm.ErrRecordNotFound):
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "task not found"})
		default:
			logger.Log.Errorw("update task status failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
		}
	}

	return ctx.SendStatus(fiber.StatusNoContent)
}

// PatchTaskDueDate godoc
// @Summary      Update task due date
// @Description  Sets or clears the due_date field of an existing task.
// @Tags         tasks
// @Accept       json
// @Produce      json
// @Param        id        path  string                 true  "Task ID"
// @Param        due_date  body  dto.UpdateTaskDueDate  true  "Due date or null"
// @Success      204
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Security     BearerAuth
// @Router       /tasks/{id}/due-date [patch]
func (h *Handlers) PatchTaskDueDate(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	taskID := ctx.Params("id")
	if taskID == "" || taskID == "nil" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "task ID is required in URL"})
	}
	if _, err := h.requireTaskAccess(ctx, taskID, userID); err != nil {
		return err
	}

	payload := map[string]*time.Time{}
	if err := json.Unmarshal(ctx.Body(), &payload); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad json"})
	}
	dueDate, ok := payload["due_date"]
	if !ok {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "due_date field is required"})
	}

	if err := h.taskService.UpdateTaskDueDate(ctx.Context(), taskID, dueDate); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "task not found"})
		}
		logger.Log.Errorw("update task due date failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}

	return ctx.SendStatus(fiber.StatusNoContent)
}

func (h *Handlers) PatchTaskAssignees(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	taskID := ctx.Params("id")
	if taskID == "" || taskID == "nil" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "task ID is required in URL"})
	}
	if _, err := h.requireTaskAccess(ctx, taskID, userID); err != nil {
		return err
	}

	var input dto.UpdateTaskAssignees
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad json"})
	}
	if input.UserIDs == nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "user_ids field is required"})
	}

	if err := h.taskService.UpdateTaskAssignees(ctx.Context(), taskID, *input.UserIDs); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "task not found"})
		}
		logger.Log.Errorw("update task assignees failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}

	return ctx.SendStatus(fiber.StatusNoContent)
}

// Swagger disabled: GetWorkspaceTasks godoc
// Swagger disabled: Summary      Get all tasks from workspace
// Swagger disabled: Description  Returns a list of all tasks for a given workspace.
// Swagger disabled: Tags         tasks
// Swagger disabled: Param        workspace_id  path      string       true  "Workspace ID"
// Swagger disabled: Success      200      {array}   dto.TaskResponse "List of tasks"
// Swagger disabled: Failure      500      {object}  map[string]string "Server error"
// Swagger disabled: Security BearerAuth
// Swagger disabled: Router       /workspace/{workspace_id}/tasks [get]
func (h *Handlers) GetWorkspaceTasks(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	var workspaceID string = ctx.Params("workspace_id")
	if err := h.requireWorkspaceMember(ctx, workspaceID, userID); err != nil {
		return err
	}
	tasks, err := h.taskService.GetWorkspaceTasks(ctx.Context(), workspaceID)
	if err != nil {
		logger.Log.Errorw("update workspace task progress failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get tasks",
		})
	}
	response := dto.WorkspaceTasksList(tasks)
	return ctx.Status(fiber.StatusOK).JSON(response)
}

// QueryWorkspaceTasks godoc
// @Summary      Query workspace tasks
// @Description  Returns workspace tasks with indexed filters, sorting, and keyset pagination.
// @Tags         tasks
// @Produce      json
// @Param        workspace_id  path   string  true   "Workspace ID"
// @Param        project_id    query  string  false  "Comma-separated project IDs or __none"
// @Param        sprint_id     query  string  false  "Comma-separated sprint IDs or __none"
// @Param        status        query  string  false  "Comma-separated task statuses"
// @Param        priority      query  string  false  "Comma-separated priorities"
// @Param        assignee_id   query  string  false  "Comma-separated assignee IDs"
// @Param        label_id      query  string  false  "Comma-separated label IDs"
// @Param        q             query  string  false  "Search text"
// @Param        due_from      query  string  false  "RFC3339 or YYYY-MM-DD"
// @Param        due_to        query  string  false  "RFC3339 or YYYY-MM-DD"
// @Param        sort_by       query  string  false  "updated_at|created_at|due_date|priority|status|key"
// @Param        direction     query  string  false  "asc|desc"
// @Param        limit         query  int     false  "Page size, max 100"
// @Param        cursor        query  string  false  "Opaque cursor from previous response"
// @Success      200           {object} dto.TaskQueryResponse
// @Failure      400           {object} map[string]string
// @Failure      401           {object} map[string]string
// @Failure      403           {object} map[string]string
// @Security     BearerAuth
// @Router       /workspaces/{workspace_id}/tasks/query [get]
func (h *Handlers) QueryWorkspaceTasks(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	workspaceID := ctx.Params("workspace_id")
	if workspaceID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "workspace ID is required in URL"})
	}
	if err := h.requireWorkspaceMember(ctx, workspaceID, userID); err != nil {
		return err
	}

	query, err := parseTaskQuery(ctx, workspaceID)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	result, err := h.taskService.QueryWorkspaceTasks(ctx.Context(), query)
	if err != nil {
		logger.Log.Errorw("query workspace tasks failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}
	return ctx.Status(fiber.StatusOK).JSON(dto.ToTaskQueryResponse(result, query))
}

// GetWorkspaceTaskCategories godoc
// @Summary      Get workspace task categories
// @Description  Returns computed task category facets for fast workspace filtering.
// @Tags         tasks
// @Produce      json
// @Param        workspace_id  path  string  true  "Workspace ID"
// @Success      200           {object} dto.WorkspaceTaskCategoriesResponse
// @Failure      401           {object} map[string]string
// @Failure      403           {object} map[string]string
// @Security     BearerAuth
// @Router       /workspaces/{workspace_id}/tasks/categories [get]
func (h *Handlers) GetWorkspaceTaskCategories(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	workspaceID := ctx.Params("workspace_id")
	if workspaceID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "workspace ID is required in URL"})
	}
	if err := h.requireWorkspaceMember(ctx, workspaceID, userID); err != nil {
		return err
	}

	categories, err := h.taskService.GetWorkspaceTaskCategories(ctx.Context(), workspaceID)
	if err != nil {
		logger.Log.Errorw("get workspace task categories failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}
	return ctx.Status(fiber.StatusOK).JSON(dto.ToWorkspaceTaskCategoriesResponse(categories))
}

// Swagger disabled: GetUserTasks godoc
// Swagger disabled: Summary      Get user's tasks
// Swagger disabled: Description  Returns a list of all tasks assigned to a specific user.
// Swagger disabled: Tags         tasks
// Swagger disabled: Param        user_id  path      string       true  "User ID"
// Swagger disabled: Success      200      {array}   dto.TaskResponse "List of user's tasks"
// Swagger disabled: Failure      500      {object}  map[string]string "Server error"
// Swagger disabled: Security BearerAuth
// Swagger disabled: Router       /user/{user_id}/tasks [get]
func (h *Handlers) GetUserTasks(ctx *fiber.Ctx) error {
	currentUserID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	workspaceID := ctx.Params("workspace_id")
	if err := h.requireWorkspaceMember(ctx, workspaceID, currentUserID); err != nil {
		return err
	}

	id := ctx.Params("user_id")
	tasks, err := h.taskService.GetWorkspaceTasks(ctx.Context(), workspaceID)
	if err != nil {
		logger.Log.Errorw("get workspace tasks failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get tasks",
		})
	}
	filtered := make([]*entity.Task, 0, len(tasks))
	for _, taskItem := range tasks {
		for _, assignedUser := range taskItem.AssignedTo {
			if assignedUser.ID == id {
				filtered = append(filtered, taskItem)
				break
			}
		}
	}

	response := dto.WorkspaceTasksList(filtered)
	return ctx.Status(fiber.StatusOK).JSON(response)
}

// Swagger disabled: UpdateTaskProgress godoc
// Swagger disabled: Summary      Update task progress
// Swagger disabled: Description  Updates the 'Progress' field of an existing task by ID. Requires JWT authentication.
// Swagger disabled: Tags         tasks
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Param        workspace_id      path      string                     true  "Workspace ID"
// Swagger disabled: Param        task_id      path      string                     true  "Task ID"
// Swagger disabled: Param        updates      body      dto.UpdateDto              true  "Updated progress value"
// Swagger disabled: Success      200      {object}  dto.TaskResponse           "Task progress updated successfully"
// Swagger disabled: Failure      400      {object}  map[string]string           "Bad request, missing fields, or invalid progress value"
// Swagger disabled: Failure      401      {object}  map[string]string           "User not authorized"
// Swagger disabled: Failure      404      {object}  map[string]string           "Task not found"
// Swagger disabled: Failure      500      {object}  map[string]string           "Internal server error"
// Swagger disabled: Security BearerAuth
// Swagger disabled: Router       /workspace/{workspace_id}/tasks/{task_id} [put]
func (h *Handlers) UpdateTaskProgress(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	taskId := ctx.Params("id")
	if taskId == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "task ID is required in URL"})
	}
	if _, err := h.requireTaskAccess(ctx, taskId, userID); err != nil {
		return err
	}
	var updates dto.UpdateDto
	if err := ctx.BodyParser(&updates); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad json"})
	}

	if updates.Progress == nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Progress field is required for this action"})
	}

	progressValue := *updates.Progress

	if progressValue != "not_started" && progressValue != "in_progress" && progressValue != "done" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad task progress"})
	}

	updatedTask, err := h.taskService.UpdateTaskProgress(ctx.Context(), taskId, progressValue)
	if err != nil {
		logger.Log.Errorw("get user tasks failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get task",
		})
	}
	return ctx.Status(fiber.StatusOK).JSON(updatedTask)
}

func (h *Handlers) DeleteTask(c *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(c)
	if authErr != nil {
		return authErr
	}
	taskID := c.Params("id")
	if taskID == "nil" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "task ID is required in URL"})
	}
	if _, err := h.requireTaskAccess(c, taskID, userID); err != nil {
		return err
	}

	err := h.taskService.Delete(c.Context(), taskID)
	if err != nil {
		logger.Log.Errorw("delete task failed", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	return c.Status(fiber.StatusOK).JSON("Successfuly deleted task")
}

func (h *Handlers) GetTaskByID(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	taskID := ctx.Params("id")
	if taskID == "nil" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "task ID is required in URL"})
	}
	if _, err := h.requireTaskAccess(ctx, taskID, userID); err != nil {
		return err
	}

	task, err := h.taskService.GetTaskByID(ctx.Context(), taskID)
	if err != nil {
		logger.Log.Errorw("get task by id failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}
	return ctx.Status(200).JSON(dto.ToTaskResponse(task))
}

func parseTaskQuery(ctx *fiber.Ctx, workspaceID string) (domaintask.Query, error) {
	cursor, err := dto.DecodeTaskCursor(strings.TrimSpace(ctx.Query("cursor")))
	if err != nil {
		return domaintask.Query{}, err
	}
	limit := 0
	if rawLimit := strings.TrimSpace(ctx.Query("limit")); rawLimit != "" {
		limit, err = strconv.Atoi(rawLimit)
		if err != nil {
			return domaintask.Query{}, err
		}
	}
	dueFrom, err := parseOptionalQueryTime(ctx.Query("due_from"))
	if err != nil {
		return domaintask.Query{}, err
	}
	dueTo, err := parseOptionalQueryTime(ctx.Query("due_to"))
	if err != nil {
		return domaintask.Query{}, err
	}
	return domaintask.Query{
		WorkspaceID: workspaceID,
		ProjectIDs:  splitQueryList(ctx.Query("project_id")),
		SprintIDs:   splitQueryList(ctx.Query("sprint_id")),
		Statuses:    splitQueryList(ctx.Query("status")),
		Priorities:  splitQueryList(ctx.Query("priority")),
		AssigneeIDs: splitQueryList(ctx.Query("assignee_id")),
		LabelIDs:    splitQueryList(ctx.Query("label_id")),
		Search:      strings.TrimSpace(ctx.Query("q")),
		DueFrom:     dueFrom,
		DueTo:       dueTo,
		SortBy:      domaintask.SortField(strings.TrimSpace(ctx.Query("sort_by"))),
		Direction:   domaintask.SortDirection(strings.TrimSpace(ctx.Query("direction"))),
		Limit:       limit,
		Cursor:      cursor,
	}, nil
}

func splitQueryList(value string) []string {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			out = append(out, part)
		}
	}
	return out
}

func parseOptionalQueryTime(value string) (*time.Time, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil, nil
	}
	parsed, err := time.Parse(time.RFC3339, value)
	if err == nil {
		return &parsed, nil
	}
	parsed, err = time.Parse("2006-01-02", value)
	if err != nil {
		return nil, err
	}
	return &parsed, nil
}
