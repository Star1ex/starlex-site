package handlers

import (
	"errors"
	"strings"

	"github.com/Star1ex/starlex-site/internal/api/dto"
	domainworkspace "github.com/Star1ex/starlex-site/internal/domain/workspace"
	"github.com/Star1ex/starlex-site/internal/logger"
	"github.com/Star1ex/starlex-site/internal/repository"
	appservice "github.com/Star1ex/starlex-site/internal/service"
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
		switch {
		case errors.Is(err, repository.ErrWorkspaceNotFound):
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "workspace not found"})
		case errors.Is(err, appservice.ErrWorkspaceForbidden):
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "internal server error",
			})
		}
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
		case errors.Is(err, appservice.ErrWorkspaceForbidden):
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
		case errors.Is(err, appservice.ErrWorkspaceForbidden):
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
		case errors.Is(err, appservice.ErrWorkspaceForbidden):
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
		default:
			logger.Log.Errorw("update workspace icon failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
		}
	}

	return ctx.SendStatus(fiber.StatusNoContent)
}

// PatchWorkspaceColor godoc
// @Summary      Update workspace color
// @Description  Updates the workspace color. Requires admin or owner.
// @Tags         workspace
// @Accept       json
// @Produce      json
// @Param        id     path      string                    true  "Workspace ID"
// @Param        color  body      dto.UpdateWorkspaceColor  true  "Workspace color"
// @Success      204
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Security     BearerAuth
// @Router       /workspaces/{id}/color [patch]
func (h *Handlers) PatchWorkspaceColor(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	workspaceID := ctx.Params("id")
	if workspaceID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "workspace id is required"})
	}

	var input dto.UpdateWorkspaceColor
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	if input.Color == nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "color field is required"})
	}

	err := h.workspaceService.UpdateWorkspaceColor(ctx.Context(), workspaceID, *input.Color, userID)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrWorkspaceNotFound):
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "workspace not found"})
		case errors.Is(err, appservice.ErrWorkspaceForbidden):
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
		default:
			return h.writeLabelError(ctx, err)
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

// ListWorkspaceMembers godoc
// @Summary      List workspace members
// @Description  Returns members and workspace-scoped roles for a workspace.
// @Tags         workspace
// @Produce      json
// @Param        id   path      string  true  "Workspace ID"
// @Success      200  {array}   dto.WorkspaceMemberResponse
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Security     BearerAuth
// @Router       /workspaces/{id}/members [get]
func (h *Handlers) ListWorkspaceMembers(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	workspaceID := ctx.Params("id")
	if workspaceID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "workspace id is required"})
	}
	if err := h.requireWorkspaceMember(ctx, workspaceID, userID); err != nil {
		return err
	}

	members, err := h.workspaceService.ListMembers(ctx.Context(), workspaceID)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrWorkspaceNotFound):
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "workspace not found"})
		default:
			logger.Log.Errorw("list workspace members failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
		}
	}
	return ctx.Status(fiber.StatusOK).JSON(dto.ToWorkspaceMemberResponses(members))
}

// AddWorkspaceMember godoc
// @Summary      Add a workspace member
// @Description  Adds a user by email with a workspace-scoped role. Requires admin or owner.
// @Tags         workspace
// @Accept       json
// @Produce      json
// @Param        id      path      string                         true  "Workspace ID"
// @Param        member  body      dto.AddWorkspaceMemberRequest  true  "Member email and role"
// @Success      201     {object}  map[string]string
// @Failure      400     {object}  map[string]string
// @Failure      401     {object}  map[string]string
// @Failure      403     {object}  map[string]string
// @Failure      404     {object}  map[string]string
// @Security     BearerAuth
// @Router       /workspaces/{id}/members [post]
func (h *Handlers) AddWorkspaceMember(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	workspaceID := ctx.Params("id")
	if workspaceID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "workspace id is required"})
	}

	var input dto.AddWorkspaceMemberRequest
	if err := ctx.BodyParser(&input); err != nil {
		logger.Log.Errorw("add workspace member body parse failed", "error", err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	input.Email = strings.TrimSpace(input.Email)
	input.Role = strings.TrimSpace(input.Role)
	if input.Email == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "email is required"})
	}

	err := h.workspaceService.AddMember(ctx.Context(), workspaceID, input.Email, input.Role, userID)
	if err != nil {
		logger.Log.Errorw("add workspace member failed", "error", err)
		return h.writeWorkspaceMemberError(ctx, err)
	}

	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "member added to workspace"})
}

// PatchWorkspaceMemberRole godoc
// @Summary      Update a workspace member role
// @Description  Updates a member's workspace-scoped role. Requires admin or owner, with owner protections.
// @Tags         workspace
// @Accept       json
// @Produce      json
// @Param        id       path  string                              true  "Workspace ID"
// @Param        user_id  path  string                              true  "User ID"
// @Param        member   body  dto.UpdateWorkspaceMemberRoleRequest true  "Role"
// @Success      204
// @Failure      400      {object}  map[string]string
// @Failure      401      {object}  map[string]string
// @Failure      403      {object}  map[string]string
// @Failure      404      {object}  map[string]string
// @Security     BearerAuth
// @Router       /workspaces/{id}/members/{user_id} [patch]
func (h *Handlers) PatchWorkspaceMemberRole(ctx *fiber.Ctx) error {
	requesterID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	workspaceID := ctx.Params("id")
	targetUserID := ctx.Params("user_id")
	if workspaceID == "" || targetUserID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "workspace id and user_id are required"})
	}

	var input dto.UpdateWorkspaceMemberRoleRequest
	if err := ctx.BodyParser(&input); err != nil {
		logger.Log.Errorw("update workspace member role body parse failed", "error", err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	input.Role = strings.TrimSpace(input.Role)
	if input.Role == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "role is required"})
	}

	err := h.workspaceService.UpdateMemberRole(ctx.Context(), workspaceID, targetUserID, input.Role, requesterID)
	if err != nil {
		logger.Log.Errorw("update workspace member role failed", "error", err)
		return h.writeWorkspaceMemberError(ctx, err)
	}

	return ctx.SendStatus(fiber.StatusNoContent)
}

// DeleteWorkspaceMember godoc
// @Summary      Remove a workspace member
// @Description  Removes a user from a workspace. Requires admin or owner, with owner protections.
// @Tags         workspace
// @Produce      json
// @Param        id       path  string  true  "Workspace ID"
// @Param        user_id  path  string  true  "User ID"
// @Success      204
// @Failure      400      {object}  map[string]string
// @Failure      401      {object}  map[string]string
// @Failure      403      {object}  map[string]string
// @Failure      404      {object}  map[string]string
// @Security     BearerAuth
// @Router       /workspaces/{id}/members/{user_id} [delete]
func (h *Handlers) DeleteWorkspaceMember(ctx *fiber.Ctx) error {
	requesterID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	workspaceID := ctx.Params("id")
	targetUserID := ctx.Params("user_id")
	if workspaceID == "" || targetUserID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "workspace id and user_id are required"})
	}

	err := h.workspaceService.RemoveUserFromWorkspace(ctx.Context(), workspaceID, targetUserID, requesterID)
	if err != nil {
		logger.Log.Errorw("remove workspace member failed", "error", err)
		return h.writeWorkspaceMemberError(ctx, err)
	}

	return ctx.SendStatus(fiber.StatusNoContent)
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
		return h.writeWorkspaceMemberError(ctx, err)
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
		return h.writeWorkspaceMemberError(ctx, err)
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "user removed from workspace successfully",
	})
}

func (h *Handlers) writeWorkspaceMemberError(ctx *fiber.Ctx, err error) error {
	switch {
	case errors.Is(err, repository.ErrWorkspaceNotFound):
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "workspace not found"})
	case errors.Is(err, repository.ErrUserNotFound):
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "user not found"})
	case errors.Is(err, repository.ErrUserAlreadyInWorkspace):
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "user already in workspace"})
	case errors.Is(err, appservice.ErrWorkspaceMemberNotFound):
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "user is not in this workspace"})
	case errors.Is(err, domainworkspace.ErrInvalidRole):
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid role"})
	case errors.Is(err, appservice.ErrWorkspaceForbidden):
		return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
	case errors.Is(err, appservice.ErrCannotManageOwner):
		return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "only owners can manage owner role"})
	case errors.Is(err, appservice.ErrCannotRemoveOwner):
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "cannot remove workspace owner"})
	case errors.Is(err, appservice.ErrCannotDemoteLastOwner):
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "last owner cannot be demoted or removed"})
	default:
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}
}
