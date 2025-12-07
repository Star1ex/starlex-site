package entity

type User struct {
	ID        string
	Email     string
	Password  string
	FirstName string
	LastName  string
	Role      string
	Photo_URL *string
}

func NewUser(id, email, hashedPassword, firstName, lastName string) *User {
	defaultRole := "member"
	return &User{
		ID:        id,
		Email:     email,
		Password:  hashedPassword,
		FirstName: firstName,
		LastName:  lastName,
		Role:      defaultRole,
		Photo_URL: nil, // Explicitly set to nil, will be set later if needed
	}
}
