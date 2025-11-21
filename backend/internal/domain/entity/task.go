package entity

import "time"

type Task struct {
	ID          string
	Task        string
	Description string
	AssignedTo  []*User
	TeamID      string
	Priority 	 string
	CreatedAt   time.Time
}

type UpdateTask struct {
	Task        string
	Description string
	AssignedTo  []User
	TeamID      string
	Priority 	 string
	CreatedAt   time.Time
}

func NewTask(ID, task, description,priority string, AssignedTo []*User) *Task {
	return &Task{
		ID:          ID,
		Task:        task,
		Description: description,
		AssignedTo:  AssignedTo,
		Priority:    priority,
	}
}
