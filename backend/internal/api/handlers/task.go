package handlers

import (
	"context"
	"log"

	"github.com/Team-Tracks/team-track-site/internal/api/dto"
	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"github.com/gofiber/fiber/v2"
)

// CreateTask godoc
// @Summary      Create task
// @Description  Creates a new task within the specified team. Requires JWT authentication.
// @Tags         tasks
// @Accept       json
// @Produce      json
// @Param        team_id         path      string       true   "Team ID"
// @Param        task_data       body      dto.TaskApi  true   "Task data"
// @Success      201  {object}   map[string]interface{}    "Task created successfully"
// @Failure      400  {object}   map[string]string         "Bad request or invalid JSON"
// @Failure      401  {object}   map[string]string         "User not authorized"
// @Failure      500  {object}   map[string]string         "Internal server error"
// @Security BearerAuth
// @Router       /team/{team_id}/tasks [post]
func (h *Handlers) CreateTask(ctx *fiber.Ctx) error {
	teamID := ctx.Params("team_id")

	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	var input dto.TaskApi
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad json"})
	}

	entityTask := &entity.Task{
		Task:        input.Task,
		Description: input.Description,
		Priority:    input.Priority,
		Progress:    input.Progress,
	}

	err := h.taskService.CreateTask(ctx.Context(), teamID, input.AssignedToID, entityTask, userID)

	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Return the created task so frontend can add it to the list
	// Fetch it back to get the full data with assigned users loaded
	createdTask, fetchErr := h.taskService.GetTaskByID(ctx.Context(), entityTask.ID)
	if fetchErr != nil {
		// If fetch fails, return basic task info
		log.Printf("Warning: Failed to fetch created task: %v", fetchErr)
		return ctx.Status(201).JSON(dto.ToTaskResponse(entityTask))
	}

	return ctx.Status(201).JSON(dto.ToTaskResponse(createdTask))
}

// GetTeamTasks godoc
// @Summary      Get all tasks from team
// @Description  Returns a list of all tasks for a given team.
// @Tags         tasks
// @Param        team_id  path      string       true  "Team ID"
// @Success      200      {array}   dto.TaskResponse "List of tasks"
// @Failure      500      {object}  map[string]string "Server error"
// @Security BearerAuth
// @Router       /team/{team_id}/tasks [get]
func (h *Handlers) GetTeamTasks(ctx *fiber.Ctx) error {
	var teamID string = ctx.Params("team_id")
	tasks, err := h.taskService.GetTeamTasks(ctx.Context(), teamID)
	if err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get tasks",
		})
	}
	response := dto.TeamTasksList(tasks)
	return ctx.Status(fiber.StatusOK).JSON(response)
}

// GetUserTasks godoc
// @Summary      Get user's tasks
// @Description  Returns a list of all tasks assigned to a specific user.
// @Tags         tasks
// @Param        user_id  path      string       true  "User ID"
// @Success      200      {array}   dto.TaskResponse "List of user's tasks"
// @Failure      500      {object}  map[string]string "Server error"
// @Security BearerAuth
// @Router       /user/{user_id}/tasks [get]
func (h *Handlers) GetUserTasks(ctx *fiber.Ctx) error {
	id := ctx.Params("user_id")

	tasks, err := h.taskService.GetUserTasks(ctx.Context(), id)
	if err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get tasks",
		})
	}
	response := dto.TeamTasksList(tasks)
	return ctx.Status(fiber.StatusOK).JSON(response)
}

// UpdateTaskProgress godoc
// @Summary      Update task progress
// @Description  Updates the 'Progress' field of an existing task by ID. Requires JWT authentication.
// @Tags         tasks
// @Accept       json
// @Produce      json
// @Param        team_id      path      string                     true  "Team ID"
// @Param        task_id      path      string                     true  "Task ID"
// @Param        updates      body      dto.UpdateDto              true  "Updated progress value"
// @Success      200      {object}  dto.TaskResponse           "Task progress updated successfully"
// @Failure      400      {object}  map[string]string           "Bad request, missing fields, or invalid progress value"
// @Failure      401      {object}  map[string]string           "User not authorized"
// @Failure      404      {object}  map[string]string           "Task not found"
// @Failure      500      {object}  map[string]string           "Internal server error"
// @Security BearerAuth
// @Router       /team/{team_id}/tasks/{task_id} [put]
func (h *Handlers) UpdateTaskProgress(ctx *fiber.Ctx) error {
	taskId := ctx.Params("id")
	if taskId == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "task ID is required in URL"})
	}
	var updates dto.UpdateDto
	if err := ctx.BodyParser(&updates); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad json"})
	}

	if updates.Progress == nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Progress field is required for this action"})
	}

	progressValue := *updates.Progress

	if progressValue != "In progress" && progressValue != "In review" && progressValue != "Done" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad task progress"})
	}

	updatedTask, err := h.taskService.UpdateTaskProgress(ctx.Context(), taskId, progressValue)
	if err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get task",
		})
	}
	return ctx.Status(fiber.StatusOK).JSON(updatedTask)
}

func (h *Handlers) DeleteTask(c *fiber.Ctx) error {
	taskID := c.Params("task_id")
	if taskID == "nil" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "task ID is required in URL"})
	}

	err := h.taskService.Delete(context.Background(), taskID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed delete task",
		})
	}

	return c.Status(fiber.StatusOK).JSON("Successfuly deleted task")
}
