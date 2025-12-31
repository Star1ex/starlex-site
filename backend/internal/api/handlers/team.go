package handlers

import (
	"context"
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

func (h *Handlers) DeleteTeam(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	var req dto.DeleteTeam
	if err := ctx.BodyParser(&req); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "missing team_id in request",
		})
	}

	err := h.teamService.Delete(context.Background(), req.TeamID, userID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err,
		})
	}
	return ctx.Status(fiber.StatusOK).JSON("Successfuly delete team")
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

// internal/api/handlers/team_handler.go

// AddUserToTeam godoc
// @Summary      Add user to team
// @Description  Add user to team by email (only team owner)
// @Tags         team
// @Accept       json
// @Produce      json
// @Param        id   path      string                    true  "Team ID"
// @Param        user body      dto.AddUserToTeam  true  "User email"
// @Success      200  {object}  map[string]interface{}    "user added successfully"
// @Failure      400  {object}  map[string]string         "bad request"
// @Failure      403  {object}  map[string]string         "forbidden"
// @Failure      404  {object}  map[string]string         "not found"
// @Failure      500  {object}  map[string]string         "internal server error"
// @Security     BearerAuth
// @Router       /team/{id}/users [post]
func (h *Handlers) AddUserToTeam(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	teamID := ctx.Params("id")
	if teamID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "team id is required",
		})
	}

	var input dto.AddUserToTeam
	if err := ctx.BodyParser(&input); err != nil {
		log.Println(err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	err := h.teamService.AddUserToTeam(ctx.Context(), teamID, input.Email, userID)
	if err != nil {
		log.Println(err)

		if err.Error() == "only team owner can add users" {
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		if err.Error() == "user already in team" {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "user added to team successfully",
	})
}

// RemoveUserFromTeam godoc
// @Summary      Remove user from team
// @Description  Remove user from team by userId (only team owner)
// @Tags         team
// @Accept       json
// @Produce      json
// @Param        id   path      string                       true  "Team ID"
// @Param        user body      dto.RemoveUserFromTeamRequest true  "User ID to remove"
// @Success      200  {object}  map[string]interface{}       "user removed successfully"
// @Failure      400  {object}  map[string]string            "bad request"
// @Failure      403  {object}  map[string]string            "forbidden"
// @Failure      404  {object}  map[string]string            "not found"
// @Failure      500  {object}  map[string]string            "internal server error"
// @Security     BearerAuth
// @Router       /team/{id}/remove-user [post]
func (h *Handlers) RemoveUserFromTeam(ctx *fiber.Ctx) error {
	// Get current authenticated user
	currentUserID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	// Get team ID from URL params
	teamID := ctx.Params("id")
	if teamID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "team id is required",
		})
	}

	// Parse request body
	var input dto.RemoveUserFromTeamRequest
	if err := ctx.BodyParser(&input); err != nil {
		log.Println(err)
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
	err := h.teamService.RemoveUserFromTeam(ctx.Context(), teamID, input.UserID, currentUserID)
	if err != nil {
		log.Println(err)

		// Handle specific errors
		switch err.Error() {
		case "only team owner can remove users":
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": err.Error(),
			})
		case "cannot remove team owner from team":
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		case "user is not in this team":
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": err.Error(),
			})
		case "team not found":
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": err.Error(),
			})
		case "user not found":
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": err.Error(),
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "user removed from team successfully",
	})
}
