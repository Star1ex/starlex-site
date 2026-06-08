package handlers

import (
	"context"
	"errors"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
	domainworkspace "github.com/Star1ex/starlex-site/internal/domain/workspace"
	"github.com/Star1ex/starlex-site/internal/repository"
	"github.com/gofiber/fiber/v2"
)

func (h *Handlers) isWorkspaceMember(ctx context.Context, workspaceID, userID string) (bool, error) {
	_, err := h.workspaceService.GetRole(ctx, workspaceID, userID)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotInWorkspace) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (h *Handlers) requireWorkspaceMember(c *fiber.Ctx, workspaceID, userID string) error {
	ok, err := h.isWorkspaceMember(c.Context(), workspaceID, userID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "workspace not found"})
	}
	if !ok {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
	}
	return nil
}

func (h *Handlers) requireWorkspaceRole(c *fiber.Ctx, workspaceID, userID string, minRole domainworkspace.Role) error {
	role, err := h.workspaceService.GetRole(c.Context(), workspaceID, userID)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotInWorkspace) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
		}
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "workspace not found"})
	}
	if !role.AtLeast(minRole) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
	}
	return nil
}

func (h *Handlers) requireTaskAccess(c *fiber.Ctx, taskID, userID string) (*entity.Task, error) {
	taskEntity, err := h.taskService.GetTaskByID(c.Context(), taskID)
	if err != nil {
		return nil, c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "task not found"})
	}
	if taskEntity.WorkspaceID == "" {
		return nil, c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
	}
	if err := h.requireWorkspaceMember(c, taskEntity.WorkspaceID, userID); err != nil {
		return nil, err
	}
	return taskEntity, nil
}

func (h *Handlers) requireDiscussionAccess(c *fiber.Ctx, discussionID, userID string) (*entity.Discussion, error) {
	disc, err := h.discussionService.GetDiscussionByID(c.Context(), discussionID)
	if err != nil {
		return nil, c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "discussion not found"})
	}
	if disc.TaskID != nil {
		if _, err := h.requireTaskAccess(c, *disc.TaskID, userID); err != nil {
			return nil, err
		}
		return disc, nil
	}
	if disc.WorkspaceID != nil && *disc.WorkspaceID != "" {
		if err := h.requireWorkspaceMember(c, *disc.WorkspaceID, userID); err != nil {
			return nil, err
		}
		return disc, nil
	}
	return nil, c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
}
