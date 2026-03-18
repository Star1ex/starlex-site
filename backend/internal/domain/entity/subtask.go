package entity

import "time"

type Subtask struct {
	ID        string
	TaskID    string
	Title     string
	IsDone    bool
	Position  int
	CreatedAt time.Time
	UpdatedAt time.Time
}
