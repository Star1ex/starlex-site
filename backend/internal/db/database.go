package db

import (
	"fmt"
	"log"

	"github.com/Team-Tracks/team-track-site/internal/config"
	pgdriver "gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type DB struct {
	*gorm.DB
}

func Must(cfg *config.DatabaseConfig) *DB {
	db, err := setupDB(cfg)
	if err != nil {
		log.Fatalf("Failed to init db: %v", err)
	}

	if err := migrate(db); err != nil {
		log.Fatalf("Failed migrate models: %v", err)
	}

	return db
}

func setupDB(cfg *config.DatabaseConfig) (*DB, error) {
	db, err := gorm.Open(pgdriver.Open(cfg.DSN()), &gorm.Config{})

	if err != nil {
		return nil, fmt.Errorf("failed connect to DB: %v", err)
	}

	log.Println("Connected to db successfully")

	return &DB{db}, nil
}

func migrate(db *DB) error {

	if err := db.AutoMigrate(); err != nil {
		return fmt.Errorf("error migrating models: %v", err)
	}

	log.Println("Models migrated successfully")
	return nil
}
