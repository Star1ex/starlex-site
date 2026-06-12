package handlers

import (
	"errors"

	"github.com/Star1ex/starlex-site/internal/api/dto"
	"github.com/Star1ex/starlex-site/internal/domain/entity"
	"github.com/Star1ex/starlex-site/internal/domain/project"
	"github.com/Star1ex/starlex-site/internal/logger"
	"github.com/Star1ex/starlex-site/internal/repository"
	appservice "github.com/Star1ex/starlex-site/internal/service"
	"github.com/gofiber/fiber/v2"
)

// projectError maps domain errors to HTTP responses.
func projectError(c *fiber.Ctx, err error) error {
	switch {
	case errors.Is(err, project.ErrProjectNotFound):
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "project not found"})
	case errors.Is(err, project.ErrNotMember):
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
	case errors.Is(err, project.ErrEmptyName):
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "project name is required"})
	case errors.Is(err, project.ErrInvalidStatus):
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid project status"})
	case errors.Is(err, project.ErrInvalidPriority):
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid project priority"})
	case errors.Is(err, project.ErrAlreadyMember):
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "user already a member"})
	case errors.Is(err, project.ErrCannotRemoveLeader):
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cannot remove the project leader"})
	case errors.Is(err, project.ErrLeaderNotMember):
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "user must belong to the workspace"})
	case errors.Is(err, repository.ErrUserNotFound):
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "user not found"})
	case errors.Is(err, appservice.ErrTaskAssigneeNotWorkspaceMember):
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "assignee must belong to workspace"})
	default:
		logger.Log.Errorw("project handler failed", "error", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}
}

func (h *Handlers) CreateProject(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	workspaceID := ctx.Params("workspace_id")
	if workspaceID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "workspace id is required"})
	}

	var input dto.CreateProjectRequest
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	input.Name = sanitizeStrict(input.Name)
	input.Description = sanitizeMarkdown(input.Description)
	input.Goal = sanitizeMarkdown(input.Goal)

	created, err := h.projectService.CreateProject(ctx.Context(), workspaceID, input.ToCreateInput(), userID)
	if err != nil {
		return projectError(ctx, err)
	}
	response := dto.ToProjectResponse(created)
	h.broadcast(created.WorkspaceID, userID, "project.created", response)
	return ctx.Status(fiber.StatusCreated).JSON(response)
}

func (h *Handlers) GetWorkspaceProjects(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	workspaceID := ctx.Params("workspace_id")
	if workspaceID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "workspace id is required"})
	}

	projects, err := h.projectService.GetWorkspaceProjects(ctx.Context(), workspaceID, userID)
	if err != nil {
		return projectError(ctx, err)
	}
	return ctx.Status(fiber.StatusOK).JSON(dto.ToProjectsResponse(projects))
}

func (h *Handlers) GetProjectByID(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	projectID := ctx.Params("id")
	if projectID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "project id is required"})
	}

	p, err := h.projectService.GetProjectByID(ctx.Context(), projectID, userID)
	if err != nil {
		return projectError(ctx, err)
	}
	return ctx.Status(fiber.StatusOK).JSON(dto.ToProjectResponse(p))
}

func (h *Handlers) UpdateProject(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	projectID := ctx.Params("id")
	if projectID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "project id is required"})
	}

	var input dto.UpdateProjectRequest
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	if input.Name != nil {
		clean := sanitizeStrict(*input.Name)
		input.Name = &clean
	}
	if input.Description != nil {
		clean := sanitizeMarkdown(*input.Description)
		input.Description = &clean
	}
	if input.Goal != nil {
		clean := sanitizeMarkdown(*input.Goal)
		input.Goal = &clean
	}

	updated, err := h.projectService.UpdateProject(ctx.Context(), projectID, input.ToUpdateFields(), userID)
	if err != nil {
		return projectError(ctx, err)
	}
	response := dto.ToProjectResponse(updated)
	h.broadcast(updated.WorkspaceID, userID, "project.updated", response)
	return ctx.Status(fiber.StatusOK).JSON(response)
}

func (h *Handlers) DeleteProject(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	projectID := ctx.Params("id")
	if projectID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "project id is required"})
	}

	// Resolve the workspace before deletion so we can target the broadcast.
	existing, lookupErr := h.projectService.GetProjectByID(ctx.Context(), projectID, userID)
	if err := h.projectService.Delete(ctx.Context(), projectID, userID); err != nil {
		return projectError(ctx, err)
	}
	if lookupErr == nil && existing != nil {
		h.broadcast(existing.WorkspaceID, userID, "project.deleted", fiber.Map{"id": projectID})
	}
	return ctx.SendStatus(fiber.StatusNoContent)
}

func (h *Handlers) GetProjectMembers(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	projectID := ctx.Params("id")
	if projectID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "project id is required"})
	}

	members, err := h.projectService.GetMembers(ctx.Context(), projectID, userID)
	if err != nil {
		return projectError(ctx, err)
	}
	return ctx.Status(fiber.StatusOK).JSON(dto.ToUsersResponse(members))
}

func (h *Handlers) AddProjectMember(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	projectID := ctx.Params("id")
	if projectID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "project id is required"})
	}

	var input dto.AddProjectMemberRequest
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	if input.Email == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "email is required"})
	}

	if err := h.projectService.AddMember(ctx.Context(), projectID, input.Email, userID); err != nil {
		return projectError(ctx, err)
	}
	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{"message": "member added"})
}

func (h *Handlers) RemoveProjectMember(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	projectID := ctx.Params("id")
	if projectID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "project id is required"})
	}

	var input dto.RemoveProjectMemberRequest
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	if input.UserID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "user_id is required"})
	}

	if err := h.projectService.RemoveMember(ctx.Context(), projectID, input.UserID, userID); err != nil {
		return projectError(ctx, err)
	}
	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{"message": "member removed"})
}

func (h *Handlers) GetProjectTasks(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	projectID := ctx.Params("id")
	if projectID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "project id is required"})
	}

	// GetProjectByID enforces project membership.
	if _, err := h.projectService.GetProjectByID(ctx.Context(), projectID, userID); err != nil {
		return projectError(ctx, err)
	}

	tasks, err := h.taskService.GetProjectTasks(ctx.Context(), projectID)
	if err != nil {
		return projectError(ctx, err)
	}
	return ctx.Status(fiber.StatusOK).JSON(dto.WorkspaceTasksList(tasks))
}

func (h *Handlers) CreateProjectTask(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	projectID := ctx.Params("id")
	if projectID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "project id is required"})
	}

	// GetProjectByID enforces project membership and gives us the workspace.
	p, err := h.projectService.GetProjectByID(ctx.Context(), projectID, userID)
	if err != nil {
		return projectError(ctx, err)
	}

	var input dto.TaskApi
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	input.Task = sanitizeStrict(input.Task)
	input.Description = sanitizeMarkdown(input.Description)
	if input.Task == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "task title is required"})
	}

	entityTask := &entity.Task{
		Task:        input.Task,
		Description: input.Description,
		Priority:    input.Priority,
		Progress:    input.Progress,
		OwnerID:     userID,
	}

	if err := h.taskService.CreateProjectTask(ctx.Context(), projectID, p.WorkspaceID, input.AssignedToID, entityTask); err != nil {
		return projectError(ctx, err)
	}

	created, fetchErr := h.taskService.GetTaskByID(ctx.Context(), entityTask.ID)
	if fetchErr != nil {
		return ctx.Status(fiber.StatusCreated).JSON(dto.ToTaskResponse(entityTask))
	}
	return ctx.Status(fiber.StatusCreated).JSON(dto.ToTaskResponse(created))
}
