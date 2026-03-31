package handlers

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
	"github.com/gofiber/fiber/v2"
)

func (h *Handlers) isTeamMember(ctx context.Context, teamID, userID string) (bool, error) {
	users, err := h.teamService.GetUsers(ctx, teamID)
	if err != nil {
		return false, err
	}

	for _, u := range users {
		if u.ID == userID {
			return true, nil
		}
	}
	return false, nil
}

func (h *Handlers) requireTeamMember(c *fiber.Ctx, teamID, userID string) error {
	ok, err := h.isTeamMember(c.Context(), teamID, userID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "team not found"})
	}
	if !ok {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
	}
	return nil
}

func (h *Handlers) requireTaskAccess(c *fiber.Ctx, taskID, userID string) (*entity.Task, error) {
	taskEntity, err := h.taskService.GetTaskByID(c.Context(), taskID)
	if err != nil {
		return nil, c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "task not found"})
	}

	if taskEntity.OwnerID == userID {
		return taskEntity, nil
	}

	if taskEntity.TeamID != "" {
		if err := h.requireTeamMember(c, taskEntity.TeamID, userID); err != nil {
			return nil, err
		}
		return taskEntity, nil
	}

	return nil, c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
}

func (h *Handlers) requireFolderAccess(c *fiber.Ctx, folderID, userID string) (*entity.Folder, error) {
	folderEntity, err := h.folderService.GetByID(c.Context(), folderID)
	if err != nil {
		return nil, c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "folder not found"})
	}

	if folderEntity.OwnerID == userID {
		return folderEntity, nil
	}

	if folderEntity.TeamID != nil && *folderEntity.TeamID != "" {
		if err := h.requireTeamMember(c, *folderEntity.TeamID, userID); err != nil {
			return nil, err
		}
		return folderEntity, nil
	}

	return nil, c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
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
	}
	if disc.FolderID != nil {
		if _, err := h.requireFolderAccess(c, *disc.FolderID, userID); err != nil {
			return nil, err
		}
	}
	return disc, nil
}
