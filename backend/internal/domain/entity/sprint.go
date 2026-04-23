package entity

import "time"

type Sprint struct {
	ID        string
	Name      string
	Goal      string
	TeamID    string
	Status    string
	StartDate *time.Time
	EndDate   *time.Time
	CreatedBy string
	CreatedAt time.Time
	UpdatedAt time.Time
	Tasks     []*Task
}
