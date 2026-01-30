package handlers

import (
	"context"

	"github.com/Team-Tracks/team-track-site/internal/api/dto"
	"github.com/gofiber/fiber/v2"
)

func (h *Handlers) CreateFolder(ctx *fiber.Ctx) error {
	var req dto.FolderDTO

	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	err := h.folderService.Create(context.Background(), dto.ToDomainFolder(&req))
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return ctx.Status(fiber.StatusOK).JSON("Successfully created folder")
}

func (h *Handlers) GetFolderByID(ctx *fiber.Ctx) error {
	var req dto.FolderGetByIdDTO

	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	folder, err := h.folderService.GetByID(context.Background(), req.ID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return ctx.Status(fiber.StatusOK).JSON(dto.FromDomainFolder(folder))
}
