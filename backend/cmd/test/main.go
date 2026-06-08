package main

import (
	"fmt"

	"github.com/Star1ex/starlex-site/internal/api/handlers"
	"github.com/Star1ex/starlex-site/internal/config"
	"github.com/Star1ex/starlex-site/internal/db"
	"github.com/Star1ex/starlex-site/internal/events"
	"github.com/Star1ex/starlex-site/internal/notifications/telegram"
	"github.com/Star1ex/starlex-site/internal/repository"
	"github.com/Star1ex/starlex-site/internal/service"
	"github.com/Star1ex/starlex-site/internal/storage"
)

func main() {
	fmt.Println("Testing")

	cfg := config.LoadConfig()

	db := db.Must(&cfg.DatabaseConfig)
	storage, err := storage.NewStorageByEnv(&cfg.StorageConfig)
	if err != nil {
		fmt.Printf("Error init storage: %v\n", err)
		return
	}

	bus := events.NewBus()

	tg, _ := telegram.New(
		cfg.TelegramNotifications.Token,
		cfg.TelegramNotifications.ChatID,
	)

	bus.Subscribe(
		"user.registered",
		handlers.UserRegisteredTelegramHandler(tg),
	)

	userRepo := repository.NewUserRepository(db.DB)
	serviceUser := service.NewUserService(userRepo, storage, bus)

	fmt.Printf("User service ready: %T\n", serviceUser)
}
