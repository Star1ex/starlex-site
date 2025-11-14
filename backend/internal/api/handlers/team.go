package handlers

import (
	"log"

	"github.com/Team-Tracks/team-track-site/internal/api/dto"
	"github.com/gofiber/fiber/v2"
)

func (h *Handlers) CreateTeam(ctx *fiber.Ctx)error{
	var input dto.TeamApi
	if err := ctx.BodyParser(&input);err != nil{
		log.Println(err)
		return ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{})
	}


	team,err:=h.teamService.CreateTeam(ctx.Context(),input.Name,input.Description,input.UserID)


	if err != nil{
		log.Println(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":"failed to create team",
		})
	}


	response := dto.ToTeamResponse(team)
	
	return ctx.Status(fiber.StatusCreated).JSON(response)
}

func (h *Handlers) GetUsers(ctx *fiber.Ctx)error{
	var id string = ctx.Params("id")
	users,err:=h.teamService.GetUsers(ctx.Context(),id)
	if err!=nil{
		log.Println(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{})
	}
	response:=dto.ToUsersResponse(users)
	return ctx.Status(fiber.StatusOK).JSON(response)
}