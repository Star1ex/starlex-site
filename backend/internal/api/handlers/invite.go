package handlers

import (
	"errors"
	"os"
	"strings"

	"github.com/Star1ex/starlex-site/internal/api/dto"
	domaininvite "github.com/Star1ex/starlex-site/internal/domain/invite"
	domainworkspace "github.com/Star1ex/starlex-site/internal/domain/workspace"
	"github.com/Star1ex/starlex-site/internal/logger"
	"github.com/Star1ex/starlex-site/internal/repository"
	appservice "github.com/Star1ex/starlex-site/internal/service"
	"github.com/gofiber/fiber/v2"
)

// CreateWorkspaceInvite godoc
// @Summary      Create a workspace invite link
// @Description  Creates a shareable invite link for a workspace. Requires admin or owner.
// @Tags         invites
// @Accept       json
// @Produce      json
// @Param        id      path      string                   true  "Workspace ID"
// @Param        invite  body      dto.CreateInviteRequest  true  "Invite role and limits"
// @Success      201     {object}  dto.CreateInviteResponse
// @Failure      400     {object}  map[string]string
// @Failure      401     {object}  map[string]string
// @Failure      403     {object}  map[string]string
// @Failure      404     {object}  map[string]string
// @Security     BearerAuth
// @Router       /workspaces/{id}/invites [post]
func (h *Handlers) CreateWorkspaceInvite(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	workspaceID := ctx.Params("id")
	if workspaceID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "workspace id is required"})
	}

	var input dto.CreateInviteRequest
	if err := ctx.BodyParser(&input); err != nil {
		logger.Log.Errorw("create invite body parse failed", "error", err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	input.Role = strings.TrimSpace(input.Role)

	invite, err := h.inviteService.Create(ctx.Context(), workspaceID, input.Role, userID, input.ExpiresInHours, input.MaxUses)
	if err != nil {
		logger.Log.Errorw("create workspace invite failed", "error", err)
		return h.writeInviteError(ctx, err)
	}

	return ctx.Status(fiber.StatusCreated).JSON(dto.CreateInviteResponse{
		Token: invite.Token,
		URL:   h.inviteURL(invite.Token),
	})
}

// ListWorkspaceInvites godoc
// @Summary      List workspace invite links
// @Description  Lists invite links for a workspace. Requires admin or owner.
// @Tags         invites
// @Produce      json
// @Param        id   path      string  true  "Workspace ID"
// @Success      200  {array}   dto.InviteResponse
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Security     BearerAuth
// @Router       /workspaces/{id}/invites [get]
func (h *Handlers) ListWorkspaceInvites(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	workspaceID := ctx.Params("id")
	if workspaceID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "workspace id is required"})
	}

	invites, err := h.inviteService.ListByWorkspace(ctx.Context(), workspaceID, userID)
	if err != nil {
		logger.Log.Errorw("list workspace invites failed", "error", err)
		return h.writeInviteError(ctx, err)
	}
	return ctx.Status(fiber.StatusOK).JSON(dto.ToInviteResponses(invites))
}

// GetInvitePreview godoc
// @Summary      Preview an invite link
// @Description  Public invite preview. Does not leak members.
// @Tags         invites
// @Produce      json
// @Param        token  path      string  true  "Invite token"
// @Success      200    {object}  dto.InvitePreviewResponse
// @Failure      404    {object}  map[string]string
// @Router       /invites/{token} [get]
func (h *Handlers) GetInvitePreview(ctx *fiber.Ctx) error {
	token := strings.TrimSpace(ctx.Params("token"))
	if token == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invite token is required"})
	}

	workspace, valid, err := h.inviteService.Preview(ctx.Context(), token)
	if err != nil {
		logger.Log.Errorw("invite preview failed", "error", err)
		return h.writeInviteError(ctx, err)
	}

	return ctx.Status(fiber.StatusOK).JSON(dto.InvitePreviewResponse{
		Workspace: dto.ToInviteWorkspacePreview(workspace),
		Valid:     valid,
	})
}

// AcceptInvite godoc
// @Summary      Accept an invite link
// @Description  Adds the authenticated user to the invite workspace and returns the workspace.
// @Tags         invites
// @Produce      json
// @Param        token  path      string  true  "Invite token"
// @Success      200    {object}  dto.WorkspaceResponse
// @Failure      400    {object}  map[string]string
// @Failure      401    {object}  map[string]string
// @Failure      404    {object}  map[string]string
// @Security     BearerAuth
// @Router       /invites/{token}/accept [post]
func (h *Handlers) AcceptInvite(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	token := strings.TrimSpace(ctx.Params("token"))
	if token == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invite token is required"})
	}

	workspace, err := h.inviteService.Accept(ctx.Context(), token, userID)
	if err != nil {
		logger.Log.Errorw("accept invite failed", "error", err)
		return h.writeInviteError(ctx, err)
	}
	return ctx.Status(fiber.StatusOK).JSON(dto.ToWorkspaceResponse(workspace))
}

// DeleteInvite godoc
// @Summary      Revoke an invite link
// @Description  Revokes an invite link. Requires admin or owner for the invite workspace.
// @Tags         invites
// @Produce      json
// @Param        id   path      string  true  "Invite ID"
// @Success      204
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Security     BearerAuth
// @Router       /invites/{id} [delete]
func (h *Handlers) DeleteInvite(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	inviteID := strings.TrimSpace(ctx.Params("id"))
	if inviteID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invite id is required"})
	}

	if err := h.inviteService.Revoke(ctx.Context(), inviteID, userID); err != nil {
		logger.Log.Errorw("delete invite failed", "error", err)
		return h.writeInviteError(ctx, err)
	}
	return ctx.SendStatus(fiber.StatusNoContent)
}

func (h *Handlers) inviteURL(token string) string {
	baseURL := strings.TrimRight(os.Getenv("APP_URL"), "/")
	if baseURL == "" {
		baseURL = strings.TrimRight(h.frontendBaseURL, "/")
	}
	if baseURL == "" {
		return "/invite/" + token
	}
	return baseURL + "/invite/" + token
}

func (h *Handlers) writeInviteError(ctx *fiber.Ctx, err error) error {
	switch {
	case errors.Is(err, domaininvite.ErrInviteNotFound):
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "invite not found"})
	case errors.Is(err, domaininvite.ErrInviteExpired):
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invite expired"})
	case errors.Is(err, domaininvite.ErrInviteRevoked):
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invite revoked"})
	case errors.Is(err, domaininvite.ErrInviteMaxUsesReached):
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invite max uses reached"})
	case errors.Is(err, appservice.ErrInviteInvalidExpiration):
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "expires_in_hours must be greater than zero"})
	case errors.Is(err, appservice.ErrInviteInvalidMaxUses):
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "max_uses must be greater than zero"})
	case errors.Is(err, domainworkspace.ErrInvalidRole):
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid role"})
	case errors.Is(err, repository.ErrWorkspaceNotFound):
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "workspace not found"})
	case errors.Is(err, appservice.ErrWorkspaceForbidden):
		return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
	case errors.Is(err, appservice.ErrCannotManageOwner):
		return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "only owners can manage owner role"})
	default:
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}
}
