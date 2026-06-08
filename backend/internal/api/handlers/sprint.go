package handlers

import (
	"errors"
	"time"

	"github.com/Star1ex/starlex-site/internal/api/dto"
	domainworkspace "github.com/Star1ex/starlex-site/internal/domain/workspace"
	"github.com/Star1ex/starlex-site/internal/service"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type sprintRequest struct {
	Name      string  `json:"name"`
	Goal      string  `json:"goal"`
	StartDate *string `json:"start_date"`
	EndDate   *string `json:"end_date"`
}

type sprintCompleteRequest struct {
	MoveTarget *string `json:"move_target"`
}

type moveTaskToSprintRequest struct {
	SprintID *string `json:"sprint_id"`
}

type updateTaskPositionRequest struct {
	Position int `json:"position"`
}

type createSubtaskRequest struct {
	Title string `json:"title"`
}

type updateSubtaskRequest struct {
	Title    *string `json:"title"`
	IsDone   *bool   `json:"is_done"`
	Position *int    `json:"position"`
}

func parseDatePtr(value *string) (*time.Time, error) {
	if value == nil || *value == "" {
		return nil, nil
	}
	t, err := time.Parse(time.RFC3339, *value)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (h *Handlers) CreateSprint(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	workspaceID := ctx.Params("workspace_id")
	if err := h.requireWorkspaceRole(ctx, workspaceID, userID, domainworkspace.RoleAdmin); err != nil {
		return err
	}

	var req sprintRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	startDate, err := parseDatePtr(req.StartDate)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid start_date"})
	}
	endDate, err := parseDatePtr(req.EndDate)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid end_date"})
	}
	name := sanitizeStrict(req.Name)
	goal := sanitizeStrict(req.Goal)

	sprint, err := h.sprintService.CreateSprint(ctx.Context(), workspaceID, userID, name, goal, startDate, endDate)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create sprint"})
	}
	return ctx.Status(fiber.StatusCreated).JSON(dto.ToSprintResponse(sprint))
}

func (h *Handlers) GetWorkspaceSprints(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	workspaceID := ctx.Params("workspace_id")
	if err := h.requireWorkspaceMember(ctx, workspaceID, userID); err != nil {
		return err
	}

	sprints, err := h.sprintService.GetWorkspaceSprints(ctx.Context(), workspaceID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to load sprints"})
	}
	return ctx.JSON(dto.ToSprintListResponse(sprints))
}

func (h *Handlers) GetSprintByID(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	workspaceID := ctx.Params("workspace_id")
	if err := h.requireWorkspaceMember(ctx, workspaceID, userID); err != nil {
		return err
	}
	id := ctx.Params("id")

	sprint, err := h.sprintService.GetSprintByID(ctx.Context(), id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "sprint not found"})
		}
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to load sprint"})
	}
	if sprint.WorkspaceID != workspaceID {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "sprint not found"})
	}
	return ctx.JSON(dto.ToSprintResponse(sprint))
}

func (h *Handlers) UpdateSprint(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	workspaceID := ctx.Params("workspace_id")
	if err := h.requireWorkspaceRole(ctx, workspaceID, userID, domainworkspace.RoleAdmin); err != nil {
		return err
	}
	id := ctx.Params("id")

	var req sprintRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	startDate, err := parseDatePtr(req.StartDate)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid start_date"})
	}
	endDate, err := parseDatePtr(req.EndDate)
	if err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid end_date"})
	}
	name := sanitizeStrict(req.Name)
	goal := sanitizeStrict(req.Goal)

	updated, err := h.sprintService.UpdateSprint(ctx.Context(), id, workspaceID, name, goal, startDate, endDate)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "sprint not found"})
		}
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update sprint"})
	}
	if updated.WorkspaceID != workspaceID {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "sprint not found"})
	}
	return ctx.JSON(dto.ToSprintResponse(updated))
}

func (h *Handlers) StartSprint(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	workspaceID := ctx.Params("workspace_id")
	if err := h.requireWorkspaceRole(ctx, workspaceID, userID, domainworkspace.RoleAdmin); err != nil {
		return err
	}
	id := ctx.Params("id")

	updated, err := h.sprintService.StartSprint(ctx.Context(), id, workspaceID)
	if err != nil {
		if errors.Is(err, service.ErrActiveSprintExists) {
			return ctx.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "another active sprint exists"})
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "sprint not found"})
		}
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to start sprint"})
	}
	return ctx.JSON(dto.ToSprintResponse(updated))
}

func (h *Handlers) CompleteSprint(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	workspaceID := ctx.Params("workspace_id")
	if err := h.requireWorkspaceRole(ctx, workspaceID, userID, domainworkspace.RoleAdmin); err != nil {
		return err
	}
	id := ctx.Params("id")

	var req sprintCompleteRequest
	if err := ctx.BodyParser(&req); err != nil && err != fiber.ErrUnprocessableEntity {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	updated, err := h.sprintService.CompleteSprint(ctx.Context(), id, workspaceID, req.MoveTarget)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "sprint not found"})
		}
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to complete sprint"})
	}
	if updated.WorkspaceID != workspaceID {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "sprint not found"})
	}
	return ctx.JSON(dto.ToSprintResponse(updated))
}

func (h *Handlers) ArchiveSprint(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	workspaceID := ctx.Params("workspace_id")
	if err := h.requireWorkspaceRole(ctx, workspaceID, userID, domainworkspace.RoleAdmin); err != nil {
		return err
	}
	id := ctx.Params("id")

	updated, err := h.sprintService.ArchiveSprint(ctx.Context(), id, workspaceID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "sprint not found"})
		}
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to archive sprint"})
	}
	if updated.WorkspaceID != workspaceID {
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "sprint not found"})
	}
	return ctx.JSON(dto.ToSprintResponse(updated))
}

func (h *Handlers) DeleteSprint(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	workspaceID := ctx.Params("workspace_id")
	if err := h.requireWorkspaceRole(ctx, workspaceID, userID, domainworkspace.RoleAdmin); err != nil {
		return err
	}
	id := ctx.Params("id")

	if err := h.sprintService.DeleteSprint(ctx.Context(), id, workspaceID); err != nil {
		if errors.Is(err, service.ErrSprintHasTasks) {
			return ctx.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "sprint has tasks"})
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "sprint not found"})
		}
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to delete sprint"})
	}
	return ctx.SendStatus(fiber.StatusNoContent)
}

func (h *Handlers) MoveTaskToSprint(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	taskID := ctx.Params("id")
	taskEntity, err := h.requireTaskWriteAccess(ctx, taskID, userID)
	if err != nil {
		return err
	}

	var req moveTaskToSprintRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if err := h.sprintService.MoveTaskToSprint(ctx.Context(), taskID, taskEntity.WorkspaceID, req.SprintID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "sprint not found"})
		}
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to move task"})
	}
	return ctx.SendStatus(fiber.StatusNoContent)
}

func (h *Handlers) UpdateTaskPosition(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	taskID := ctx.Params("id")
	taskEntity, err := h.requireTaskWriteAccess(ctx, taskID, userID)
	if err != nil {
		return err
	}

	var req updateTaskPositionRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if err := h.sprintService.UpdateTaskPosition(ctx.Context(), taskID, taskEntity.WorkspaceID, req.Position); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update task position"})
	}
	return ctx.SendStatus(fiber.StatusNoContent)
}

func (h *Handlers) CreateSubtask(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	taskID := ctx.Params("task_id")
	if _, err := h.requireTaskWriteAccess(ctx, taskID, userID); err != nil {
		return err
	}

	var req createSubtaskRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	if req.Title == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "title is required"})
	}
	title := sanitizeStrict(req.Title)

	subtask, err := h.sprintService.CreateSubtask(ctx.Context(), taskID, title)
	if err != nil {
		if errors.Is(err, service.ErrSubtaskLimit) {
			return ctx.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "subtask limit reached"})
		}
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create subtask"})
	}
	return ctx.Status(fiber.StatusCreated).JSON(dto.ToSubtaskResponse(subtask))
}

func (h *Handlers) UpdateSubtask(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	taskID := ctx.Params("task_id")
	if _, err := h.requireTaskWriteAccess(ctx, taskID, userID); err != nil {
		return err
	}
	subtaskID := ctx.Params("id")

	var req updateSubtaskRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	if req.Title != nil {
		s := sanitizeStrict(*req.Title)
		req.Title = &s
	}

	subtask, err := h.sprintService.UpdateSubtask(ctx.Context(), taskID, subtaskID, req.Title, req.IsDone, req.Position)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "subtask not found"})
		}
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update subtask"})
	}
	return ctx.JSON(dto.ToSubtaskResponse(subtask))
}

func (h *Handlers) DeleteSubtask(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	taskID := ctx.Params("task_id")
	if _, err := h.requireTaskWriteAccess(ctx, taskID, userID); err != nil {
		return err
	}
	subtaskID := ctx.Params("id")

	if err := h.sprintService.DeleteSubtask(ctx.Context(), taskID, subtaskID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "subtask not found"})
		}
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to delete subtask"})
	}
	return ctx.SendStatus(fiber.StatusNoContent)
}
