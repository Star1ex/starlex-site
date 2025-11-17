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
	task,err:=h.taskService.CreateTask(ctx.Context(),input.AssignedToID,input.Task,input.Description,teamID)
	if err != nil{
		log.Println(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":"failed to create new task",
		})
	}
	response:=dto.ToTaskResponse(task)

	return ctx.Status(fiber.StatusCreated).JSON(response)
}

func (h *Handlers)GetTeamTasks(ctx *fiber.Ctx)error{
	var teamID string = ctx.Params("teamID")
	tasks,err:=h.taskService.GetTeamTasks(ctx.Context(),teamID)
	if err!=nil{
		log.Println(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":"failed to get tasks",
		})
	}
	response:=dto.TeamTasksList(tasks)
	return  ctx.Status(fiber.StatusOK).JSON(response)
}



func (h *Handlers)GetUserTasks(ctx *fiber.Ctx)error{
	var id string 

	tasks,err:=h.taskService.GetUserTasks(ctx.Context(),id)
	if err!=nil{
		log.Println(err)
		return ctx.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error":"failed to get tasks",
		})
	}
	response:=dto.TeamTasksList(tasks)
	return  ctx.Status(fiber.StatusOK).JSON(response)
}