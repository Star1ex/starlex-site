package handlers

import (
	"log"

	"github.com/Team-Tracks/team-track-site/internal/api/dto"
	"github.com/gofiber/fiber/v2"
)

// CreateTeam godoc
// @Summary      Created team
// @Description  Created new team
// @Tags         team
// @Accept       json
// @Produce      json
// @Param        user            body      dto.TeamApi  true  "Team data"
// @Success      201  {object}   map[string]interface{}    "team created successfuly"
// @Failure      400  {object}   map[string]string         "bad request"
// @Failure      500  {object}   map[string]string         "internal server error"
// @Security BearerAuth
// @Router       /team [post]
func (h *Handlers) CreateTeam(ctx *fiber.Ctx) error {

	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	var input dto.TeamApi
	if err := ctx.BodyParser(&input); err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{})
	}

	team, err := h.teamService.CreateTeam(ctx.Context(), input.Name, input.Description, userID)

	if err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	response := dto.ToTeamResponse(team)

	return ctx.Status(fiber.StatusCreated).JSON(response)
}

// GetUsers godoc
// @Summary 		Get all users from team
// @Description 	Return all users from team
// @Tags team
// @Param id path string true "Team ID"
// @Success 200 {array} dto.UserResponse "List of users"
// @Failure 500 {object} map[string]string "Server error"
// @Security BearerAuth
// @Router /team/{id} [get]
func (h *Handlers) GetUsers(ctx *fiber.Ctx) error {
	var id string = ctx.Params("id")

	users, err := h.teamService.GetUsers(ctx.Context(), id)
	if err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	response := dto.ToUsersResponse(users)
	return ctx.Status(fiber.StatusOK).JSON(response)
}
