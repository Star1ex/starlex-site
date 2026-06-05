package handlers

import (
	"errors"
	"strings"

	"github.com/Star1ex/starlex-site/internal/api/dto"
	"github.com/Star1ex/starlex-site/internal/domain/entity"
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

	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
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

func (h *Handlers) CreatePersonalTask(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
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
		Priority:    input.Priority,
		Progress:    input.Progress,
		OwnerID:     userID,
		WorkspaceID: "",
		FolderID:    input.FolderID,
	}
	if input.FolderID != nil && *input.FolderID != "" {
		folderEntity, err := h.requireFolderAccess(ctx, *input.FolderID, userID)
		if err != nil {
			return err
		}
		if folderEntity.WorkspaceID != nil && *folderEntity.WorkspaceID != "" {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "personal tasks cannot be created in workspace folders"})
		}
	}

	err := h.taskService.CreatePersonalTask(ctx.Context(), entityTask)
	if err != nil {
		logger.Log.Errorw("create personal task failed", "error", err)
		return ctx.Status(500).JSON(fiber.Map{"error": "internal server error"})
	}

	return ctx.Status(201).JSON(dto.ToTaskResponse(entityTask))
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

	if err := h.taskService.UpdateTaskStatus(ctx.Context(), taskID, progressValue); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "task not found"})
		}
		logger.Log.Errorw("update task progress failed", "error", err)
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

func (h *Handlers) GetPersonalTasks(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	tasks, err := h.taskService.GetTasksWithoutFolder(ctx.Context(), userID)
	if err != nil {
		logger.Log.Errorw("get personal tasks failed", "error", err)
		return ctx.Status(500).JSON(fiber.Map{"error": "internal server error"})
	}

	return ctx.Status(200).JSON(dto.WorkspaceTasksList(tasks))
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

// Swagger disabled: GetTasksWithoutFolder godoc
// Swagger disabled: Summary      Get tasks without folder
// Swagger disabled: Description  Returns a list of all tasks without a folder.
// Swagger disabled: Tags         tasks
// Swagger disabled: Param        user_id  path      string       true  "User ID"
// Swagger disabled: Success      200      {array}   dto.TaskResponse "List of tasks without folder"
// Swagger disabled: Failure      500      {object}  map[string]string "Server error"
// Swagger disabled: Security BearerAuth
// Swagger disabled: Router       /tasks/without-folder [get]
func (h *Handlers) GetTasksWithoutFolder(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	tasks, err := h.taskService.GetTasksWithoutFolder(ctx.Context(), userID)
	if err != nil {
		logger.Log.Errorw("get tasks without folder failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}
	return ctx.Status(fiber.StatusOK).JSON(dto.WorkspaceTasksList(tasks))
}

func (h *Handlers) GetFolderTasks(ctx *fiber.Ctx) error {

	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return ctx.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	folderID := ctx.Params("folder_id")
	if folderID == "nil" || folderID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "folder ID is required in URL"})
	}
	if _, err := h.requireFolderAccess(ctx, folderID, userID); err != nil {
		return err
	}

	tasks, err := h.taskService.GetFolderTasks(ctx.Context(), folderID)
	if err != nil {
		logger.Log.Errorw("get folder tasks failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}
	return ctx.Status(fiber.StatusOK).JSON(dto.WorkspaceTasksList(tasks))
}

func (h *Handlers) MoveTaskToFolder(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	taskID := ctx.Params("id")
	folderID := ctx.Query("folder_id")
	if taskID == "nil" || folderID == "nil" || taskID == "" || folderID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "task ID and folder ID are required in URL"})
	}
	taskEntity, err := h.requireTaskAccess(ctx, taskID, userID)
	if err != nil {
		return err
	}
	folderEntity, err := h.requireFolderAccess(ctx, folderID, userID)
	if err != nil {
		return err
	}
	if taskEntity.WorkspaceID != "" {
		if folderEntity.WorkspaceID == nil || *folderEntity.WorkspaceID != taskEntity.WorkspaceID {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "workspace task must remain in same workspace folder"})
		}
	}

	err = h.taskService.MoveTaskToFolder(ctx.Context(), taskID, folderID)
	if err != nil {
		logger.Log.Errorw("move task to folder failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}
	return ctx.Status(fiber.StatusOK).JSON("Successfully moved task to folder")
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
