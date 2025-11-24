package entity

type User struct {
	ID        string
	Email     string
	Password  string
	FirstName string
	LastName  string
	Photo_URL *string
}

func NewUser(id, email, hashedPassword, firstName, lastName string) *User {
	return &User{
		ID:        id,
		Email:     email,
		Password:  hashedPassword,
		FirstName: firstName,
		LastName:  lastName,
	}
}
