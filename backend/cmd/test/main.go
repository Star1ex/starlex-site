package main

import (
	"context"
	"fmt"

	"github.com/Team-Tracks/team-track-site/internal/api/dto"
	"github.com/Team-Tracks/team-track-site/internal/config"
	"github.com/Team-Tracks/team-track-site/internal/db"
	"github.com/Team-Tracks/team-track-site/internal/repository"
	"github.com/Team-Tracks/team-track-site/internal/service"
	"github.com/Team-Tracks/team-track-site/internal/storage"
)

func main() {
	fmt.Println("Testing")

	cfg := config.LoadConfig()

	db := db.Must(&cfg.DatabaseConfig)
	storage, err := storage.NewStorageByEnv(&cfg.StorageConfig)
	if err != nil {
		fmt.Errorf("Error init storager")
	}

	ctx := context.Background()

	userRepo := repository.NewUserRepository(db.DB)
	serviceUser := service.NewUserService(userRepo, storage)

	u := dto.UserApi{
		Email:     "eblan@gmail.com",
		Password:  "1234",
		FirstName: "John",
		LastName:  "Strawb",
	}

	serviceUser.Create(ctx, &u)
}
