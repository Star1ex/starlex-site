package handlers

import (
	"strings"
	"sync"

	"github.com/Star1ex/starlex-site/internal/api/dto"
	"github.com/Star1ex/starlex-site/internal/domain/entity"
	"github.com/gofiber/fiber/v2"
)

// Search godoc — search users by email (existing endpoint, unchanged)
func (h *Handlers) Search(ctx *fiber.Ctx) error {
	_, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	email := ctx.Params("email")
	if email == "" {
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid email"})
	}

	users, err := h.userService.Search(ctx.Context(), email)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "not found user"})
	}

	return ctx.Status(fiber.StatusOK).JSON(dto.ToUsersResponse(users))
}

// GlobalSearch godoc — search tasks, sprints, and teams by query string
func (h *Handlers) GlobalSearch(ctx *fiber.Ctx) error {
	userID, authErr := h.getAuthenticatedUserID(ctx)
	if authErr != nil {
		return authErr
	}

	query := strings.TrimSpace(ctx.Query("q"))
	if len(query) < 1 {
		return ctx.Status(fiber.StatusOK).JSON(dto.GlobalSearchResponse{
			Teams: []dto.SearchTeamResult{}, Sprints: []dto.SearchSprintResult{}, Tasks: []dto.SearchTaskResult{},
		})
	}

	// Get all teams the user belongs to
	teams, err := h.userService.GetTeams(ctx.Context(), userID)
	if err != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to get teams"})
	}

	teamIDs := make([]string, len(teams))
	for i, t := range teams {
		teamIDs[i] = t.ID
	}

	// Filter teams by name in-memory
	lowerQ := strings.ToLower(query)
	var matchedTeams []*entity.Team
	for _, t := range teams {
		if strings.Contains(strings.ToLower(t.Name), lowerQ) {
			matchedTeams = append(matchedTeams, t)
			if len(matchedTeams) == 5 {
				break
			}
		}
	}

	// Search tasks and sprints in parallel
	var (
		taskResults   []*entity.Task
		sprintResults []*entity.Sprint
		taskErr       error
		sprintErr     error
		wg            sync.WaitGroup
	)

	wg.Add(2)
	go func() {
		defer wg.Done()
		taskResults, taskErr = h.taskService.SearchInTeams(ctx.Context(), teamIDs, query)
	}()
	go func() {
		defer wg.Done()
		sprintResults, sprintErr = h.sprintService.SearchInTeams(ctx.Context(), teamIDs, query)
	}()
	wg.Wait()

	if taskErr != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "search failed"})
	}
	if sprintErr != nil {
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "search failed"})
	}

	// Build response
	teamRes := make([]dto.SearchTeamResult, len(matchedTeams))
	for i, t := range matchedTeams {
		teamRes[i] = dto.ToSearchTeamResult(t)
	}

	sprintRes := make([]dto.SearchSprintResult, len(sprintResults))
	for i, s := range sprintResults {
		sprintRes[i] = dto.ToSearchSprintResult(s)
	}

	taskRes := make([]dto.SearchTaskResult, len(taskResults))
	for i, t := range taskResults {
		taskRes[i] = dto.ToSearchTaskResult(t)
	}

	return ctx.Status(fiber.StatusOK).JSON(dto.GlobalSearchResponse{
		Teams:   teamRes,
		Sprints: sprintRes,
		Tasks:   taskRes,
	})
}
