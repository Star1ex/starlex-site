package repository

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"testing"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type noopConnPool struct{}

func (noopConnPool) PrepareContext(context.Context, string) (*sql.Stmt, error) {
	return nil, errors.New("dry run only")
}

func (noopConnPool) ExecContext(context.Context, string, ...any) (sql.Result, error) {
	return nil, errors.New("dry run only")
}

func (noopConnPool) QueryContext(context.Context, string, ...any) (*sql.Rows, error) {
	return nil, errors.New("dry run only")
}

func (noopConnPool) QueryRowContext(context.Context, string, ...any) *sql.Row {
	return nil
}

type sqlCaptureLogger struct {
	logger.Interface
	sql string
}

func (l *sqlCaptureLogger) LogMode(logger.LogLevel) logger.Interface {
	return l
}

func (l *sqlCaptureLogger) Trace(_ context.Context, _ time.Time, fc func() (string, int64), _ error) {
	l.sql, _ = fc()
}

func newDryRunDB(t *testing.T, capture *sqlCaptureLogger) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(postgres.New(postgres.Config{
		Conn:                 noopConnPool{},
		PreferSimpleProtocol: true,
	}), &gorm.Config{
		DryRun: true,
		Logger: capture,
	})
	if err != nil {
		t.Fatalf("open dry run db: %v", err)
	}
	return db
}

func assertSQLContains(t *testing.T, sql string, required ...string) {
	t.Helper()
	for _, part := range required {
		if !strings.Contains(sql, part) {
			t.Fatalf("expected SQL to contain %q, got %q", part, sql)
		}
	}
}

func TestSprintRepositoryGetWorkspaceSprintsScopesByWorkspaceID(t *testing.T) {
	capture := &sqlCaptureLogger{}
	repo := NewSprintRepository(newDryRunDB(t, capture))

	if _, err := repo.GetWorkspaceSprints(context.Background(), "ws-1"); err != nil {
		t.Fatalf("get workspace sprints: %v", err)
	}

	assertSQLContains(t, capture.sql, `FROM "sprint_models"`, `WHERE workspace_id = 'ws-1'`)
}

func TestTaskRepositoryGetWorkspaceTasksScopesByWorkspaceID(t *testing.T) {
	capture := &sqlCaptureLogger{}
	repo := NewTaskRepository(newDryRunDB(t, capture))

	if _, err := repo.GetWorkspaceTasks(context.Background(), "ws-1"); err != nil {
		t.Fatalf("get workspace tasks: %v", err)
	}

	assertSQLContains(t, capture.sql, `FROM "task_models"`, `WHERE workspace_id = 'ws-1' AND sprint_id IS NULL`)
}
