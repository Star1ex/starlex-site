package handlers

import (
	"log"

	"github.com/Team-Tracks/team-track-site/internal/api/dto"
	"github.com/gofiber/fiber/v2"
)

func (h *Handlers) GetTeams(ctx *fiber.Ctx) error {
	var id string = ctx.Params("id")
	teams, err := h.userService.GetTeams(ctx.Context(), id)
	if err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{})
	}
	response := dto.ToTeamsResponse(teams)
	return ctx.Status(fiber.StatusOK).JSON(response)
}
