package handlers

import (
	"errors"
	"strings"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"github.com/Team-Tracks/team-track-site/internal/service"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type discussionCreateRequest struct {
	Title       string `json:"title"`
	Content     string `json:"content"`
	ContentType string `json:"content_type"`
}

type discussionUpdateRequest struct {
	Title      *string `json:"title"`
	IsResolved *bool   `json:"is_resolved"`
}

type messageCreateRequest struct {
	Content     string `json:"content"`
	ContentType string `json:"content_type"`
}

type messageUpdateRequest struct {
	Content string `json:"content"`
}

func (h *Handlers) CreateTaskDiscussion(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	taskID := ctx.Params("id")
	taskEntity, err := h.requireTaskAccess(ctx, taskID, userID)
	if err != nil {
		return err
	}

	var req discussionCreateRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	if strings.TrimSpace(req.Title) == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "title is required"})
	}
	title := sanitizeStrict(req.Title)
	content := req.Content

	teamID := ""
	if taskEntity.TeamID != "" {
		teamID = taskEntity.TeamID
	}

	discussion, err := h.discussionService.CreateDiscussion(ctx.Context(), &taskID, nil, teamID, userID, title, content, req.ContentType)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create discussion"})
	}
	return ctx.Status(fiber.StatusCreated).JSON(discussion)
}

func (h *Handlers) CreateFolderDiscussion(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	folderID := ctx.Params("id")
	folderEntity, err := h.requireFolderAccess(ctx, folderID, userID)
	if err != nil {
		return err
	}

	var req discussionCreateRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	if strings.TrimSpace(req.Title) == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "title is required"})
	}
	title := sanitizeStrict(req.Title)
	content := req.Content

	teamID := ""
	if folderEntity.TeamID != nil {
		teamID = *folderEntity.TeamID
	}

	discussion, err := h.discussionService.CreateDiscussion(ctx.Context(), nil, &folderID, teamID, userID, title, content, req.ContentType)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create discussion"})
	}
	return ctx.Status(fiber.StatusCreated).JSON(discussion)
}

func (h *Handlers) GetTaskDiscussions(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	taskID := ctx.Params("id")
	if _, err := h.requireTaskAccess(ctx, taskID, userID); err != nil {
		return err
	}

	discussions, err := h.discussionService.GetDiscussionsByTask(ctx.Context(), taskID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to load discussions"})
	}
	return ctx.JSON(discussions)
}

func (h *Handlers) GetFolderDiscussions(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	folderID := ctx.Params("id")
	if _, err := h.requireFolderAccess(ctx, folderID, userID); err != nil {
		return err
	}

	discussions, err := h.discussionService.GetDiscussionsByFolder(ctx.Context(), folderID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to load discussions"})
	}
	return ctx.JSON(discussions)
}

func (h *Handlers) GetDiscussionByID(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	discussionID := ctx.Params("id")
	if _, err := h.requireDiscussionAccess(ctx, discussionID, userID); err != nil {
		return err
	}

	discussion, err := h.discussionService.GetDiscussionByID(ctx.Context(), discussionID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "discussion not found"})
		}
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to load discussion"})
	}
	return ctx.JSON(discussion)
}

func (h *Handlers) UpdateDiscussion(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	discussionID := ctx.Params("id")
	disc, err := h.requireDiscussionAccess(ctx, discussionID, userID)
	if err != nil {
		return err
	}

	var req discussionUpdateRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	if req.Title != nil {
		s := sanitizeStrict(*req.Title)
		req.Title = &s
	}

	if disc.CreatedBy != userID {
		if req.IsResolved != nil {
			if !h.canResolveDiscussion(ctx, disc, userID) {
				return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
			}
		} else {
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
		}
	}

	updated, err := h.discussionService.UpdateDiscussion(ctx.Context(), discussionID, req.Title, req.IsResolved)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update discussion"})
	}
	return ctx.JSON(updated)
}

func (h *Handlers) DeleteDiscussion(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	discussionID := ctx.Params("id")
	disc, err := h.requireDiscussionAccess(ctx, discussionID, userID)
	if err != nil {
		return err
	}
	if disc.CreatedBy != userID {
		return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
	}

	if err := h.discussionService.DeleteDiscussion(ctx.Context(), discussionID); err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to delete discussion"})
	}
	return ctx.SendStatus(fiber.StatusNoContent)
}

func (h *Handlers) CreateDiscussionMessage(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	discussionID := ctx.Params("id")
	if _, err := h.requireDiscussionAccess(ctx, discussionID, userID); err != nil {
		return err
	}

	var req messageCreateRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	message, err := h.discussionService.CreateMessage(ctx.Context(), discussionID, userID, req.Content, req.ContentType)
	if err != nil {
		if errors.Is(err, service.ErrMessageEmpty) {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "content is required"})
		}
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create message"})
	}
	return ctx.Status(fiber.StatusCreated).JSON(message)
}

func (h *Handlers) UpdateDiscussionMessage(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	discussionID := ctx.Params("did")
	if _, err := h.requireDiscussionAccess(ctx, discussionID, userID); err != nil {
		return err
	}
	messageID := ctx.Params("mid")

	var req messageUpdateRequest
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	message, err := h.discussionService.UpdateMessage(ctx.Context(), discussionID, messageID, userID, req.Content)
	if err != nil {
		if errors.Is(err, service.ErrMessageEmpty) {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "content is required"})
		}
		if errors.Is(err, service.ErrDiscussionForbidden) {
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "message not found"})
		}
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update message"})
	}
	return ctx.JSON(message)
}

func (h *Handlers) DeleteDiscussionMessage(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	discussionID := ctx.Params("did")
	if _, err := h.requireDiscussionAccess(ctx, discussionID, userID); err != nil {
		return err
	}
	messageID := ctx.Params("mid")

	if err := h.discussionService.DeleteMessage(ctx.Context(), discussionID, messageID, userID); err != nil {
		if errors.Is(err, service.ErrDiscussionForbidden) {
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
		}
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "message not found"})
		}
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to delete message"})
	}
	return ctx.SendStatus(fiber.StatusNoContent)
}

func (h *Handlers) canResolveDiscussion(ctx *fiber.Ctx, disc *entity.Discussion, userID string) bool {
	if disc.CreatedBy == userID {
		return true
	}
	if disc.TeamID == nil || *disc.TeamID == "" {
		return false
	}
	team, err := h.teamService.GetTeamByID(ctx.Context(), *disc.TeamID)
	if err != nil {
		return false
	}
	return team.OwnerID == userID
}
