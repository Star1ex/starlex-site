package main

import (
	"context"
	"fmt"

	"github.com/Team-Tracks/team-track-site/internal/config"
	"github.com/Team-Tracks/team-track-site/internal/db"
	"github.com/Team-Tracks/team-track-site/internal/domain/user"
	"github.com/Team-Tracks/team-track-site/internal/repository"
	"github.com/Team-Tracks/team-track-site/internal/service"
)

func main() {
	fmt.Println("Testing")

	cfg := config.LoadConfig()

	db := db.Must(&cfg.DatabaseConfig)

	ctx := context.Background()

	userRepo := repository.NewRepository(db.DB)
	serviceUser := service.NewUserService(userRepo)

	u := user.User{
		Email:     "eblan@gmail.com",
		Password:  "1234",
		FirstName: "John",
		LastName:  "Strawb",
	}

	serviceUser.Create(ctx, &u)
}
