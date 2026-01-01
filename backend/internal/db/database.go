package db

import (
	"fmt"
	"log"
	"time"

	"github.com/Team-Tracks/team-track-site/internal/config"
	"github.com/Team-Tracks/team-track-site/internal/repository"
	pgdriver "gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type DB struct {
	*gorm.DB
}

func Must(cfg *config.DatabaseConfig) *DB {
	var db *DB
	var err error

	// Retry connection up to 5 times with 2 second delays
	// This helps when DB is starting up in Docker
	for i := 0; i < 5; i++ {
		db, err = setupDB(cfg)
		if err == nil {
			break
		}
		if i < 4 {
			log.Printf("Failed to connect to DB, retry %d/5: %v", i+1, err)
			time.Sleep(2 * time.Second)
		}
	}

	if err != nil {
		log.Fatalf("Failed to init db after 5 retries: %v", err)
	}

	if err := migrate(db); err != nil {
		log.Fatalf("Failed migrate models: %v", err)
	}

	return db
}

func setupDB(cfg *config.DatabaseConfig) (*DB, error) {
	db, err := gorm.Open(pgdriver.Open(cfg.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed connect to DB: %v", err)
	}

	log.Println("Connected to db successfully")

	return &DB{db}, nil
}

func migrate(db *DB) error {

	if err := db.AutoMigrate(
		&repository.UserModel{},
		&repository.TeamModel{},
		&repository.TaskModel{},
		&repository.VerificationCodeModel{},
	); err != nil {
		return fmt.Errorf("error migrating models: %v", err)
	}

	log.Println("Models migrated successfully")
	return nil
}
