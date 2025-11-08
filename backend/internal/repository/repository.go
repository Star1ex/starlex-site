package repository

import (
	"github.com/Team-Tracks/team-track-site/internal/domain/user"
	"gorm.io/gorm"
)
type User struct{
	ID        string `gorm:"primaryKey"`
	Email     string `gorm:"unique;not null"`
	Password  string `gorm:"not null"`
	FirstName string `gorm:"not null;size:50"`
	LastName  string `gorm:"not null;size:50"`
}


type UserRepository struct{
	db *gorm.DB
}

func fromDomain(u *user.User)*User{
	return &User{
		ID: u.ID,
		Email: u.Email,
		Password: u.Password,
		FirstName: u.FirstName,
		LastName: u.LastName,
	}
}

func toDomain(u *User)*user.User{
	return &user.User{
		ID: u.ID,
		Email: u.Email,
		Password: u.Password,
		FirstName: u.FirstName,
		LastName: u.LastName,
	}
}

func NewRepository(db *gorm.DB)*UserRepository{
	return &UserRepository{db: db}
}


