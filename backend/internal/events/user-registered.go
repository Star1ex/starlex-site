package events

import "time"

type UserRegisteredEvent struct {
	UserID     string
	Email      string
	FirstName  string
	LastName   string
	OccurredAt time.Time
}

func (UserRegisteredEvent) Name() string {
	return "user.registered"
}
