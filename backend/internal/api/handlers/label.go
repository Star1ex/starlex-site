package handlers

import (
	"errors"
	"strings"

	"github.com/Star1ex/starlex-site/internal/api/dto"
	domainlabel "github.com/Star1ex/starlex-site/internal/domain/label"
	"github.com/Star1ex/starlex-site/internal/logger"
	appservice "github.com/Star1ex/starlex-site/internal/service"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// ListWorkspaceLabels godoc
// @Summary      List workspace labels
// @Description  Returns labels for a workspace.
// @Tags         labels
// @Produce      json
// @Param        id   path      string  true  "Workspace ID"
// @Success      200  {array}   dto.LabelResponse
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Security     BearerAuth
// @Router       /workspaces/{id}/labels [get]
func (h *Handlers) ListWorkspaceLabels(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	workspaceID := ctx.Params("id")
	if workspaceID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "workspace id is required"})
	}
	labels, err := h.labelService.ListByWorkspace(ctx.Context(), workspaceID, userID)
	if err != nil {
		logger.Log.Errorw("list workspace labels failed", "error", err)
		return h.writeLabelError(ctx, err)
	}
	return ctx.Status(fiber.StatusOK).JSON(dto.ToLabelResponses(labels))
}

// CreateWorkspaceLabel godoc
// @Summary      Create workspace label
// @Description  Creates a label for a workspace. Requires admin or owner.
// @Tags         labels
// @Accept       json
// @Produce      json
// @Param        id     path      string                  true  "Workspace ID"
// @Param        label  body      dto.CreateLabelRequest  true  "Label"
// @Success      201    {object}  dto.LabelResponse
// @Failure      400    {object}  map[string]string
// @Failure      401    {object}  map[string]string
// @Failure      403    {object}  map[string]string
// @Security     BearerAuth
// @Router       /workspaces/{id}/labels [post]
func (h *Handlers) CreateWorkspaceLabel(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	workspaceID := ctx.Params("id")
	if workspaceID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "workspace id is required"})
	}
	var input dto.CreateLabelRequest
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	label, err := h.labelService.Create(ctx.Context(), workspaceID, input.Name, input.Color, userID)
	if err != nil {
		logger.Log.Errorw("create workspace label failed", "error", err)
		return h.writeLabelError(ctx, err)
	}
	return ctx.Status(fiber.StatusCreated).JSON(dto.ToLabelResponse(label))
}

// PatchLabel godoc
// @Summary      Update label
// @Description  Updates a label. Requires admin or owner of the label workspace.
// @Tags         labels
// @Accept       json
// @Produce      json
// @Param        id     path      string                  true  "Label ID"
// @Param        label  body      dto.UpdateLabelRequest  true  "Label patch"
// @Success      200    {object}  dto.LabelResponse
// @Failure      400    {object}  map[string]string
// @Failure      401    {object}  map[string]string
// @Failure      403    {object}  map[string]string
// @Failure      404    {object}  map[string]string
// @Security     BearerAuth
// @Router       /labels/{id} [patch]
func (h *Handlers) PatchLabel(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	labelID := strings.TrimSpace(ctx.Params("id"))
	if labelID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "label id is required"})
	}
	var input dto.UpdateLabelRequest
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	label, err := h.labelService.Update(ctx.Context(), labelID, input.Name, input.Color, userID)
	if err != nil {
		logger.Log.Errorw("update label failed", "error", err)
		return h.writeLabelError(ctx, err)
	}
	return ctx.Status(fiber.StatusOK).JSON(dto.ToLabelResponse(label))
}

// DeleteLabel godoc
// @Summary      Delete label
// @Description  Deletes a label. Requires admin or owner of the label workspace.
// @Tags         labels
// @Produce      json
// @Param        id  path  string  true  "Label ID"
// @Success      204
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Security     BearerAuth
// @Router       /labels/{id} [delete]
func (h *Handlers) DeleteLabel(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	labelID := strings.TrimSpace(ctx.Params("id"))
	if labelID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "label id is required"})
	}
	if err := h.labelService.Delete(ctx.Context(), labelID, userID); err != nil {
		logger.Log.Errorw("delete label failed", "error", err)
		return h.writeLabelError(ctx, err)
	}
	return ctx.SendStatus(fiber.StatusNoContent)
}

// PatchTaskLabels godoc
// @Summary      Replace task labels
// @Description  Replaces the labels assigned to a task.
// @Tags         tasks
// @Accept       json
// @Produce      json
// @Param        id      path  string                       true  "Task ID"
// @Param        labels  body  dto.UpdateTaskLabelsRequest  true  "Label IDs"
// @Success      204
// @Failure      400  {object}  map[string]string
// @Failure      401  {object}  map[string]string
// @Failure      403  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Security     BearerAuth
// @Router       /tasks/{id}/labels [patch]
func (h *Handlers) PatchTaskLabels(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	taskID := ctx.Params("id")
	if taskID == "" || taskID == "nil" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "task ID is required in URL"})
	}
	if _, err := h.requireTaskWriteAccess(ctx, taskID, userID); err != nil {
		return err
	}
	var input dto.UpdateTaskLabelsRequest
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "bad json"})
	}
	if err := h.taskService.UpdateTaskLabels(ctx.Context(), taskID, input.LabelIDs); err != nil {
		logger.Log.Errorw("update task labels failed", "error", err)
		return h.writeLabelError(ctx, err)
	}
	return ctx.SendStatus(fiber.StatusNoContent)
}

func (h *Handlers) writeLabelError(ctx *fiber.Ctx, err error) error {
	switch {
	case errors.Is(err, domainlabel.ErrInvalidName):
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid label name"})
	case errors.Is(err, domainlabel.ErrInvalidColor):
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid label color"})
	case errors.Is(err, domainlabel.ErrLabelNotFound):
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "label not found"})
	case errors.Is(err, appservice.ErrWorkspaceForbidden):
		return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
	case errors.Is(err, gorm.ErrRecordNotFound):
		return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "not found"})
	default:
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
	}
}
