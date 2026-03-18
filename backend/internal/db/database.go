package db

import (
	"fmt"
	"log"
	"os"
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
	logLevel := logger.Info
	if os.Getenv("APP_ENV") == "production" {
		logLevel = logger.Warn
	}
	db, err := gorm.Open(pgdriver.Open(cfg.DSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
	})
	if err != nil {
		return nil, fmt.Errorf("failed connect to DB: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(5 * time.Minute)
	sqlDB.SetConnMaxIdleTime(2 * time.Minute)

	log.Println("Connected to db successfully")

	return &DB{db}, nil
}

func migrate(db *DB) error {

	if err := db.AutoMigrate(
		&repository.UserModel{},
		&repository.TeamModel{},
		&repository.TaskModel{},
		&repository.FolderModel{},
		&repository.VerificationCodeModel{},
		&repository.PasswordResetTokenModel{},
		&repository.PasswordAuditLogModel{},
	); err != nil {
		return fmt.Errorf("error migrating models: %v", err)
	}

	//if err := fillDefaultOwnerIDs(db); err != nil {
	//	return fmt.Errorf("failed to fill task owner_ids: %v", err)
	//}

	log.Println("Models migrated successfully")
	return nil
}

func fillDefaultOwnerIDs(db *DB) error {

	var count int64

	db.Raw(`SELECT COUNT(*) FROM task_models WHERE owner_id IS NULL`).Scan(&count)

	if count == 0 {
		log.Println("All tasks already have owner_id")
		return nil
	}

	log.Printf("Filling owner_id for %d tasks", count)

	var defaultOwner repository.UserModel
	if err := db.First(&defaultOwner).Error; err != nil {
		return fmt.Errorf("no users found for default owner: %v", err)
	}

	result := db.Exec(`
		UPDATE task_models
		SET owner_id = ?
		WHERE owner_id IS NULL
	`, defaultOwner.ID)

	if result.Error != nil {
		return fmt.Errorf("failed to update owner_id: %v", result.Error)
	}

	log.Printf("Updated %d tasks with default owner_id: %s", result.RowsAffected, defaultOwner.ID)
	return nil
}
