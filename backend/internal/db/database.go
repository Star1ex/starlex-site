package db

import (
	"fmt"
	"os"
	"time"

	"github.com/Star1ex/starlex-site/internal/config"
	"github.com/Star1ex/starlex-site/internal/logger"
	"github.com/Star1ex/starlex-site/internal/repository"
	pgdriver "gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

type DB struct {
	*gorm.DB
}

func Must(cfg *config.DatabaseConfig) *DB {
	var db *DB
	var err error

	// Retry connection up to 10 times with 3 second delays
	// This helps when DB is starting up in Docker
	for i := 0; i < 10; i++ {
		db, err = setupDB(cfg)
		if err == nil {
			break
		}
		if i < 9 {
			logger.Log.Warnw("Failed to connect to DB, retrying", "attempt", i+1, "error", err)
			time.Sleep(3 * time.Second)
		}
	}

	if err != nil {
		logger.Log.Fatalw("Failed to init db after 5 retries", "error", err)
	}

	if err := migrate(db); err != nil {
		logger.Log.Fatalw("Failed migrate models", "error", err)
	}

	return db
}

func setupDB(cfg *config.DatabaseConfig) (*DB, error) {
	logLevel := gormlogger.Info
	if os.Getenv("APP_ENV") == "production" {
		logLevel = gormlogger.Warn
	}
	db, err := gorm.Open(pgdriver.Open(cfg.DSN()), &gorm.Config{
		Logger: gormlogger.Default.LogMode(logLevel),
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

	logger.Log.Infow("Connected to db successfully")

	return &DB{db}, nil
}

func migrate(db *DB) error {

	if err := db.AutoMigrate(
		&repository.UserModel{},
		&repository.WorkspaceModel{},
		&repository.WorkspaceMemberModel{},
		&repository.UserPreferenceModel{},
		&repository.ProjectModel{},
		&repository.SprintModel{},
		&repository.LabelModel{},
		&repository.TaskModel{},
		&repository.SubtaskModel{},
		&repository.DiscussionModel{},
		&repository.DiscussionMessageModel{},
		&repository.SessionModel{},
		&repository.PendingRegistrationModel{},
		&repository.PasswordResetTokenModel{},
		&repository.PasswordAuditLogModel{},
		&repository.InviteModel{},
	); err != nil {
		return fmt.Errorf("error migrating models: %v", err)
	}

	if err := backfillWorkspaceMembers(db); err != nil {
		return fmt.Errorf("failed to backfill workspace members: %w", err)
	}

	//if err := fillDefaultOwnerIDs(db); err != nil {
	//	return fmt.Errorf("failed to fill task owner_ids: %v", err)
	//}

	logger.Log.Infow("Models migrated successfully")
	return nil
}

func backfillWorkspaceMembers(db *DB) error {
	if err := db.Exec(`
		INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
		SELECT w.id, w.owner_id, 'owner', NOW()
		FROM workspace_models w
		JOIN user_models u ON u.id = w.owner_id
		WHERE w.owner_id <> ''
		ON CONFLICT (workspace_id, user_id) DO NOTHING
	`).Error; err != nil {
		return fmt.Errorf("failed to insert workspace owners: %w", err)
	}

	if err := db.Exec(`
		UPDATE workspace_members wm
		SET role = 'owner'
		FROM workspace_models w
		WHERE wm.workspace_id = w.id
			AND wm.user_id = w.owner_id
			AND wm.role <> 'owner'
	`).Error; err != nil {
		return fmt.Errorf("failed to normalize workspace owner roles: %w", err)
	}

	if err := db.Exec(`
		DO $$
		BEGIN
			IF to_regclass('public.users_workspaces') IS NOT NULL
				AND EXISTS (
					SELECT 1
					FROM information_schema.columns
					WHERE table_schema = 'public'
						AND table_name = 'users_workspaces'
						AND column_name = 'user_model_id'
				)
				AND EXISTS (
					SELECT 1
					FROM information_schema.columns
					WHERE table_schema = 'public'
						AND table_name = 'users_workspaces'
						AND column_name = 'workspace_model_id'
				)
			THEN
				INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
				SELECT uw.workspace_model_id,
					uw.user_model_id,
					CASE WHEN w.owner_id = uw.user_model_id THEN 'owner' ELSE 'member' END,
					NOW()
				FROM users_workspaces uw
				JOIN workspace_models w ON w.id = uw.workspace_model_id
				JOIN user_models u ON u.id = uw.user_model_id
				ON CONFLICT (workspace_id, user_id) DO NOTHING;
			END IF;
		END $$;
	`).Error; err != nil {
		return fmt.Errorf("failed to import legacy workspace memberships: %w", err)
	}

	return nil
}

func fillDefaultOwnerIDs(db *DB) error {

	var count int64

	db.Raw(`SELECT COUNT(*) FROM task_models WHERE owner_id IS NULL`).Scan(&count)

	if count == 0 {
		logger.Log.Infow("All tasks already have owner_id")
		return nil
	}

	logger.Log.Infow("Filling owner_id for tasks", "count", count)

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

	logger.Log.Infow("Updated tasks with default owner_id", "count", result.RowsAffected, "owner_id", defaultOwner.ID)
	return nil
}
