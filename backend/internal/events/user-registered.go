package events

type UserRegisteredEvent struct {
	UserID    string
	Email     string
	FirstName string
	LastName  string
}

func (UserRegisteredEvent) Name() string {
	return "user.registered"
}
