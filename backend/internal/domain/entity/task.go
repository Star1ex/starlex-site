package entity

import "time"

type Task struct {
	ID          string
	Task        string
	Description string
	AssignedTo  string
	TeamID 		string
	CreatedAt   time.Time
}

func NewTask(ID,task,description,AssignedTo string)*Task{
	return &Task{
		ID: ID,
		Task: task,
		Description: description,
		AssignedTo: AssignedTo,
	}
}