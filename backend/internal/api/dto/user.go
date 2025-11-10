package dto

import "github.com/Team-Tracks/team-track-site/internal/domain/user"

type UserApi struct {
	Email     string `json:"email" binding:"required"`
	Password  string `json:"password" binding:"required"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}


type UserResponse struct {
    ID        string `json:"id"` 
    Email     string `json:"email"`
    FirstName string `json:"first_name"`
    LastName  string `json:"last_name"`
}

func ToUserApi(u *user.User) *UserApi {
	return &UserApi{
		Email:     u.Email,
		Password:  u.Password,
		FirstName: u.FirstName,
		LastName:  u.LastName,
	}
}

func FromUserApi(u *UserApi) *user.User {
	return &user.User{
		Email:     u.Email,
		Password:  u.Password,
		FirstName: u.FirstName,
		LastName:  u.LastName,
	}
}

func ToUserResponse(u *user.User) *UserResponse{
	return  &UserResponse{
		ID: u.ID,
		Email: u.Email,
		FirstName: u.FirstName,
		LastName: u.LastName,
	}
}