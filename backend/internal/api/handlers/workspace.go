package handlers

import (
	"errors"
	"strings"

	"github.com/Star1ex/starlex-site/internal/api/dto"
	"github.com/Star1ex/starlex-site/internal/logger"
	"github.com/Star1ex/starlex-site/internal/repository"
	"github.com/gofiber/fiber/v2"
)

// Swagger disabled: CreateWorkspace godoc
// Swagger disabled: Summary      Created workspace
// Swagger disabled: Description  Created new workspace
// Swagger disabled: Tags         workspace
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Param        user            body      dto.WorkspaceApi  true  "Workspace data"
// Swagger disabled: Success      201  {object}   map[string]interface{}    "workspace created successfuly"
// Swagger disabled: Failure      400  {object}   map[string]string         "bad request"
// Swagger disabled: Failure      500  {object}   map[string]string         "internal server error"
// Swagger disabled: Security BearerAuth
// Swagger disabled: Router       /workspace [post]
func (h *Handlers) CreateWorkspace(ctx *fiber.Ctx) error {

	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	var input dto.WorkspaceApi
	if err := ctx.BodyParser(&input); err != nil {
		logger.Log.Errorw("create workspace body parse failed", "error", err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{})
	}

	workspace, err := h.workspaceService.CreateWorkspace(ctx.Context(), input.Name, input.Description, userID)

	if err != nil {
		logger.Log.Errorw("create workspace failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	response := dto.ToWorkspaceResponse(workspace)

	return ctx.Status(fiber.StatusCreated).JSON(response)
}

func (h *Handlers) DeleteWorkspace(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	workspaceID := ctx.Params("id")
	if workspaceID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "missing workspace_id in path",
		})
	}

	err := h.workspaceService.Delete(ctx.Context(), workspaceID, userID)
	if err != nil {
		logger.Log.Errorw("delete workspace failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}
	return ctx.Status(fiber.StatusOK).JSON("Successfuly delete workspace")
}

func (h *Handlers) PatchWorkspaceName(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	workspaceID := ctx.Params("id")
	if workspaceID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "workspace id is required",
		})
	}

	var input dto.UpdateWorkspaceName
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}
	if input.Name == nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "name field is required",
		})
	}
	name := strings.TrimSpace(*input.Name)
	if name == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "workspace name cannot be empty",
		})
	}

	err := h.workspaceService.UpdateWorkspaceName(ctx.Context(), workspaceID, name, userID)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrWorkspaceNotFound):
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "workspace not found"})
		case errors.Is(err, repository.ErrWorkspaceAlreadyExists):
			return ctx.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "workspace name already exists"})
		case err.Error() == "only workspace owner can update workspace name":
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
		default:
			logger.Log.Errorw("update workspace name failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
		}
	}

	return ctx.SendStatus(fiber.StatusNoContent)
}

func (h *Handlers) PatchWorkspaceDescription(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	workspaceID := ctx.Params("id")
	if workspaceID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "workspace id is required",
		})
	}

	var input dto.UpdateWorkspaceDescription
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}
	if input.Description == nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "description field is required",
		})
	}

	err := h.workspaceService.UpdateWorkspaceDescription(ctx.Context(), workspaceID, *input.Description, userID)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrWorkspaceNotFound):
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "workspace not found"})
		case err.Error() == "only workspace owner can update workspace description":
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
		default:
			logger.Log.Errorw("update workspace description failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
		}
	}

	return ctx.SendStatus(fiber.StatusNoContent)
}

func (h *Handlers) PatchWorkspaceIcon(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	workspaceID := ctx.Params("id")
	if workspaceID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "workspace id is required"})
	}

	var input dto.UpdateWorkspaceIcon
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	if input.Icon == nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "icon field is required"})
	}

	err := h.workspaceService.UpdateWorkspaceIcon(ctx.Context(), workspaceID, *input.Icon, userID)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrWorkspaceNotFound):
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "workspace not found"})
		case err.Error() == "only workspace owner can update workspace icon":
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
		default:
			logger.Log.Errorw("update workspace icon failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
		}
	}

	return ctx.SendStatus(fiber.StatusNoContent)
}

// Swagger disabled: GetUsers godoc
// Swagger disabled: Summary 		Get all users from workspace
// Swagger disabled: Description 	Return all users from workspace
// Swagger disabled: Tags workspace
// Swagger disabled: Param id path string true "Workspace ID"
// Swagger disabled: Success 200 {array} dto.UserResponse "List of users"
// Swagger disabled: Failure 500 {object} map[string]string "Server error"
// Swagger disabled: Security BearerAuth
// Swagger disabled: Router /workspace/{id} [get]
func (h *Handlers) GetUsers(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	var id string = ctx.Params("id")
	if err := h.requireWorkspaceMember(ctx, id, userID); err != nil {
		return err
	}

	users, err := h.workspaceService.GetUsers(ctx.Context(), id)
	if err != nil {
		logger.Log.Errorw("get workspace users failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}
	response := dto.ToUsersResponse(users)
	return ctx.Status(fiber.StatusOK).JSON(response)
}

// internal/api/handlers/workspace_handler.go

// Swagger disabled: AddUserToWorkspace godoc
// Swagger disabled: Summary      Add user to workspace
// Swagger disabled: Description  Add user to workspace by email (only workspace owner)
// Swagger disabled: Tags         workspace
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Param        id   path      string                    true  "Workspace ID"
// Swagger disabled: Param        user body      dto.AddUserToWorkspace  true  "User email"
// Swagger disabled: Success      200  {object}  map[string]interface{}    "user added successfully"
// Swagger disabled: Failure      400  {object}  map[string]string         "bad request"
// Swagger disabled: Failure      403  {object}  map[string]string         "forbidden"
// Swagger disabled: Failure      404  {object}  map[string]string         "not found"
// Swagger disabled: Failure      500  {object}  map[string]string         "internal server error"
// Swagger disabled: Security     BearerAuth
// Swagger disabled: Router       /workspace/{id}/users [post]
func (h *Handlers) AddUserToWorkspace(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	workspaceID := ctx.Params("id")
	if workspaceID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "workspace id is required",
		})
	}

	var input dto.AddUserToWorkspace
	if err := ctx.BodyParser(&input); err != nil {
		logger.Log.Errorw("add user body parse failed", "error", err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	err := h.workspaceService.AddUserToWorkspace(ctx.Context(), workspaceID, input.Email, userID)
	if err != nil {
		logger.Log.Errorw("add user to workspace failed", "error", err)

		if err.Error() == "only workspace owner can add users" {
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "forbidden",
			})
		}
		if err.Error() == "user already in workspace" {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "user already in workspace",
			})
		}

		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "user added to workspace successfully",
	})
}

// Swagger disabled: RemoveUserFromWorkspace godoc
// Swagger disabled: Summary      Remove user from workspace
// Swagger disabled: Description  Remove user from workspace by userId (only workspace owner)
// Swagger disabled: Tags         workspace
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Param        id   path      string                       true  "Workspace ID"
// Swagger disabled: Param        user body      dto.RemoveUserFromWorkspaceRequest true  "User ID to remove"
// Swagger disabled: Success      200  {object}  map[string]interface{}       "user removed successfully"
// Swagger disabled: Failure      400  {object}  map[string]string            "bad request"
// Swagger disabled: Failure      403  {object}  map[string]string            "forbidden"
// Swagger disabled: Failure      404  {object}  map[string]string            "not found"
// Swagger disabled: Failure      500  {object}  map[string]string            "internal server error"
// Swagger disabled: Security     BearerAuth
// Swagger disabled: Router       /workspace/{id}/remove-user [post]
func (h *Handlers) RemoveUserFromWorkspace(ctx *fiber.Ctx) error {
	// Get current authenticated user
	currentUserID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	// Get workspace ID from URL params
	workspaceID := ctx.Params("id")
	if workspaceID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "workspace id is required",
		})
	}

	// Parse request body
	var input dto.RemoveUserFromWorkspaceRequest
	if err := ctx.BodyParser(&input); err != nil {
		logger.Log.Errorw("remove user body parse failed", "error", err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	if input.UserID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "userId is required",
		})
	}

	// Call service to remove user
	err := h.workspaceService.RemoveUserFromWorkspace(ctx.Context(), workspaceID, input.UserID, currentUserID)
	if err != nil {
		logger.Log.Errorw("remove user from workspace failed", "error", err)

		// Handle specific errors
		switch err.Error() {
		case "only workspace owner can remove users":
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "forbidden",
			})
		case "cannot remove workspace owner from workspace":
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "cannot remove workspace owner from workspace",
			})
		case "user is not in this workspace":
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "user is not in this workspace",
			})
		case "workspace not found":
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "workspace not found",
			})
		case "user not found":
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "user not found",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "internal server error",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "user removed from workspace successfully",
	})
}
