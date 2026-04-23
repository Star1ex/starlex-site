package handlers

import (
	"errors"
	"strings"

	"github.com/Team-Tracks/team-track-site/internal/api/dto"
	"github.com/Team-Tracks/team-track-site/internal/logger"
	"github.com/Team-Tracks/team-track-site/internal/repository"
	"github.com/gofiber/fiber/v2"
)

// Swagger disabled: CreateTeam godoc
// Swagger disabled: Summary      Created team
// Swagger disabled: Description  Created new team
// Swagger disabled: Tags         team
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Param        user            body      dto.TeamApi  true  "Team data"
// Swagger disabled: Success      201  {object}   map[string]interface{}    "team created successfuly"
// Swagger disabled: Failure      400  {object}   map[string]string         "bad request"
// Swagger disabled: Failure      500  {object}   map[string]string         "internal server error"
// Swagger disabled: Security BearerAuth
// Swagger disabled: Router       /team [post]
func (h *Handlers) CreateTeam(ctx *fiber.Ctx) error {

	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	var input dto.TeamApi
	if err := ctx.BodyParser(&input); err != nil {
		logger.Log.Errorw("create team body parse failed", "error", err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{})
	}

	team, err := h.teamService.CreateTeam(ctx.Context(), input.Name, input.Description, userID)

	if err != nil {
		logger.Log.Errorw("create team failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
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
	teamID := ctx.Params("id")
	if teamID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "missing team_id in path",
		})
	}

	err := h.teamService.Delete(ctx.Context(), teamID, userID)
	if err != nil {
		logger.Log.Errorw("delete team failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}
	return ctx.Status(fiber.StatusOK).JSON("Successfuly delete team")
}

func (h *Handlers) PatchTeamName(ctx *fiber.Ctx) error {
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

	var input dto.UpdateTeamName
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}
	if input.Name == nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "name field is required",
		})
	}
	name := strings.TrimSpace(*input.Name)
	if name == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "team name cannot be empty",
		})
	}

	err := h.teamService.UpdateTeamName(ctx.Context(), teamID, name, userID)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrTeamNotFound):
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "team not found"})
		case errors.Is(err, repository.ErrTeamAlreadyExists):
			return ctx.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "team name already exists"})
		case err.Error() == "only team owner can update team name":
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
		default:
			logger.Log.Errorw("update team name failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
		}
	}

	return ctx.SendStatus(fiber.StatusNoContent)
}

func (h *Handlers) PatchTeamDescription(ctx *fiber.Ctx) error {
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

	var input dto.UpdateTeamDescription
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}
	if input.Description == nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "description field is required",
		})
	}

	err := h.teamService.UpdateTeamDescription(ctx.Context(), teamID, *input.Description, userID)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrTeamNotFound):
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "team not found"})
		case err.Error() == "only team owner can update team description":
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
		default:
			logger.Log.Errorw("update team description failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
		}
	}

	return ctx.SendStatus(fiber.StatusNoContent)
}

func (h *Handlers) PatchTeamIcon(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	teamID := ctx.Params("id")
	if teamID == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "team id is required"})
	}

	var input dto.UpdateTeamIcon
	if err := ctx.BodyParser(&input); err != nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}
	if input.Icon == nil {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "icon field is required"})
	}

	err := h.teamService.UpdateTeamIcon(ctx.Context(), teamID, *input.Icon, userID)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrTeamNotFound):
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "team not found"})
		case err.Error() == "only team owner can update team icon":
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "forbidden"})
		default:
			logger.Log.Errorw("update team icon failed", "error", err)
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "internal server error"})
		}
	}

	return ctx.SendStatus(fiber.StatusNoContent)
}

// Swagger disabled: GetUsers godoc
// Swagger disabled: Summary 		Get all users from team
// Swagger disabled: Description 	Return all users from team
// Swagger disabled: Tags team
// Swagger disabled: Param id path string true "Team ID"
// Swagger disabled: Success 200 {array} dto.UserResponse "List of users"
// Swagger disabled: Failure 500 {object} map[string]string "Server error"
// Swagger disabled: Security BearerAuth
// Swagger disabled: Router /team/{id} [get]
func (h *Handlers) GetUsers(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}
	var id string = ctx.Params("id")
	if err := h.requireTeamMember(ctx, id, userID); err != nil {
		return err
	}

	users, err := h.teamService.GetUsers(ctx.Context(), id)
	if err != nil {
		logger.Log.Errorw("get team users failed", "error", err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}
	response := dto.ToUsersResponse(users)
	return ctx.Status(fiber.StatusOK).JSON(response)
}

// internal/api/handlers/team_handler.go

// Swagger disabled: AddUserToTeam godoc
// Swagger disabled: Summary      Add user to team
// Swagger disabled: Description  Add user to team by email (only team owner)
// Swagger disabled: Tags         team
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Param        id   path      string                    true  "Team ID"
// Swagger disabled: Param        user body      dto.AddUserToTeam  true  "User email"
// Swagger disabled: Success      200  {object}  map[string]interface{}    "user added successfully"
// Swagger disabled: Failure      400  {object}  map[string]string         "bad request"
// Swagger disabled: Failure      403  {object}  map[string]string         "forbidden"
// Swagger disabled: Failure      404  {object}  map[string]string         "not found"
// Swagger disabled: Failure      500  {object}  map[string]string         "internal server error"
// Swagger disabled: Security     BearerAuth
// Swagger disabled: Router       /team/{id}/users [post]
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
		logger.Log.Errorw("add user body parse failed", "error", err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	err := h.teamService.AddUserToTeam(ctx.Context(), teamID, input.Email, userID)
	if err != nil {
		logger.Log.Errorw("add user to team failed", "error", err)

		if err.Error() == "only team owner can add users" {
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "forbidden",
			})
		}
		if err.Error() == "user already in team" {
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "user already in team",
			})
		}

		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "internal server error",
		})
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "user added to team successfully",
	})
}

// Swagger disabled: RemoveUserFromTeam godoc
// Swagger disabled: Summary      Remove user from team
// Swagger disabled: Description  Remove user from team by userId (only team owner)
// Swagger disabled: Tags         team
// Swagger disabled: Accept       json
// Swagger disabled: Produce      json
// Swagger disabled: Param        id   path      string                       true  "Team ID"
// Swagger disabled: Param        user body      dto.RemoveUserFromTeamRequest true  "User ID to remove"
// Swagger disabled: Success      200  {object}  map[string]interface{}       "user removed successfully"
// Swagger disabled: Failure      400  {object}  map[string]string            "bad request"
// Swagger disabled: Failure      403  {object}  map[string]string            "forbidden"
// Swagger disabled: Failure      404  {object}  map[string]string            "not found"
// Swagger disabled: Failure      500  {object}  map[string]string            "internal server error"
// Swagger disabled: Security     BearerAuth
// Swagger disabled: Router       /team/{id}/remove-user [post]
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
		logger.Log.Errorw("remove user body parse failed", "error", err)
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
		logger.Log.Errorw("remove user from team failed", "error", err)

		// Handle specific errors
		switch err.Error() {
		case "only team owner can remove users":
			return ctx.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "forbidden",
			})
		case "cannot remove team owner from team":
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "cannot remove team owner from team",
			})
		case "user is not in this team":
			return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "user is not in this team",
			})
		case "team not found":
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "team not found",
			})
		case "user not found":
			return ctx.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "user not found",
			})
		default:
			return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "internal server error",
			})
		}
	}

	return ctx.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "user removed from team successfully",
	})
}
