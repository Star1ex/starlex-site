package handlers

import (
	"log"

	"github.com/Team-Tracks/team-track-site/internal/api/dto"
	"github.com/gofiber/fiber/v2"
)

// GetTeams godoc
// @Summary      Get teams by user
// @Description  Returns a list of all tasks for a given team.
// @Tags         users
// @Param        user_id  path      string       true  "User ID"
// @Success      200      {array}   dto.TeamResponse "List of teams"
// @Failure      500      {object}  map[string]string "Server error"
// @Security BearerAuth
// @Router       /team/:id [get]
func (h *Handlers) GetTeams(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	teams, err := h.userService.GetTeams(ctx.Context(), id)
	if err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{})
	}
	response := dto.ToTeamsResponse(teams)
	return ctx.Status(fiber.StatusOK).JSON(response)
}

// UploadPhoto godoc
// @Summary Upload user photo
// @Description Uploads a photo file for a specific user
// @Tags users
// @Accept multipart/form-data
// @Produce json
// @Param id path string true "User ID"
// @Param photo formData file true "Photo file"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /users/{id}/photo [post]
func (h *Handlers) UploadPhoto(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid id",
		})
	}

	file, err := c.FormFile("photo")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid file",
		})
	}

	url, err := h.userService.UploadUserPhoto(c.Context(), id, file)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "error uploading photo",
		})
	}

	return c.JSON(fiber.Map{"url": url})
}
