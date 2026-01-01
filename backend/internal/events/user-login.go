package events

import "time"

type UserLoginEvent struct {
	UserID     string
	Email      string
	FirstName  string
	LastName   string
	OccurredAt time.Time
}

func (UserLoginEvent) Name() string {
	return "user.login"
}
