package handlers

import (
	"log"

	"github.com/Team-Tracks/team-track-site/internal/api/dto"
	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"github.com/gofiber/fiber/v2"
)

func (h *Handlers) CreateTask(ctx *fiber.Ctx) error {
	teamID := ctx.Params("teamID")

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

	err := h.taskService.CreateTask(ctx.Context(), teamID, input.AssignedToID, entityTask)

	if err != nil {
		return ctx.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return ctx.Status(201).JSON("Task created")
}

func (h *Handlers) GetTeamTasks(ctx *fiber.Ctx) error {
	var teamID string = ctx.Params("teamID")
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

func (h *Handlers) GetUserTasks(ctx *fiber.Ctx) error {
	var id string

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


func (h *Handlers) UpdateTaskProgress(ctx *fiber.Ctx) error{
	taskId := ctx.Params("id")
    if taskId == "" {
        return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "task ID is required in URL"})
    }
	var updates dto.UpdateDto
	if err := ctx.BodyParser(&updates); err != nil{
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad json"})
	}

	if updates.Progress == nil {
        return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Progress field is required for this action"})
    }
    
    progressValue := *updates.Progress
	
		if progressValue != "In progress" && progressValue != "In review" && progressValue != "Done" {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad task progress"})
		}
	
	updatedTask, err := h.taskService.UpdateTaskProgress(ctx.Context(),taskId,progressValue)
	if err != nil{
		log.Println(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get task",
		})
	}
	return ctx.Status(fiber.StatusOK).JSON(updatedTask)
}