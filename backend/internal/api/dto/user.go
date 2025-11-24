package dto

import (
	"github.com/Team-Tracks/team-track-site/internal/domain/entity"
)

type UserApi struct {
	Email     string  `json:"email" binding:"required"`
	Password  string  `json:"password" binding:"required"`
	FirstName string  `json:"first_name"`
	LastName  string  `json:"last_name"`
	Photo_URL *string `json:"photo_url"`
}

type UserResponse struct {
	ID        string  `json:"id"`
	Email     string  `json:"email"`
	FirstName string  `json:"first_name"`
	LastName  string  `json:"last_name"`
	Photo_URL *string `json:"photo_url"`
}

func ToUserApi(u *entity.User) *UserApi {
	return &UserApi{
		Email:     u.Email,
		Password:  u.Password,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		Photo_URL: u.Photo_URL,
	}
}

func FromUserApi(u *UserApi) *entity.User {
	return &entity.User{
		Email:     u.Email,
		Password:  u.Password,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		Photo_URL: u.Photo_URL,
	}
}

func ToUserResponse(u *entity.User) *UserResponse {
	return &UserResponse{
		ID:        u.ID,
		Email:     u.Email,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		Photo_URL: u.Photo_URL,
	}
}
