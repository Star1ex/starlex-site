package handlers

import (
	"log"

	"github.com/Team-Tracks/team-track-site/internal/api/dto"
	"github.com/gofiber/fiber/v2"
)

func(h *Handlers)CreateTask(ctx *fiber.Ctx)error{
	var teamID string = ctx.Params("teamID")
	var input dto.TaskApi
	err:=ctx.BodyParser(&input)
	if err != nil{
		log.Println(err)
		return  ctx.Status(fiber.StatusBadRequest).JSON(fiber.Map{})
	}
	err=h.taskService.CreateTask(ctx.Context(),input.UserID,input.Task,input.Description,teamID)
	if err != nil{
		log.Println(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":"failed to create new task",
		})
	}
	return ctx.Status(fiber.StatusCreated).JSON(fiber.Map{"message":"task successfully created"})
}