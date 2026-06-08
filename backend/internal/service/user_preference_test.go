package service

import (
	"context"
	"errors"
	"testing"

	domainpreference "github.com/Star1ex/starlex-site/internal/domain/preference"
	"github.com/Star1ex/starlex-site/internal/domain/workspace"
)

type userPreferenceRepoMock struct {
	domainpreference.Repository
	data map[string]*domainpreference.Preferences
}

func newUserPreferenceRepoMock() *userPreferenceRepoMock {
	return &userPreferenceRepoMock{data: map[string]*domainpreference.Preferences{}}
}

func (m *userPreferenceRepoMock) Get(_ context.Context, userID string) (*domainpreference.Preferences, error) {
	preferences, ok := m.data[userID]
	if !ok {
		return nil, domainpreference.ErrPreferencesNotFound
	}
	return clonePreferences(preferences), nil
}

func (m *userPreferenceRepoMock) Upsert(_ context.Context, preferences *domainpreference.Preferences) error {
	m.data[preferences.UserID] = clonePreferences(preferences)
	return nil
}

func TestUserPreferenceServiceGet(t *testing.T) {
	stored := domainpreference.DefaultPreferences("user2")
	stored.Theme = domainpreference.ThemeDark

	tests := []struct {
		name      string
		userID    string
		stored    *domainpreference.Preferences
		wantTheme domainpreference.Theme
	}{
		{name: "returns defaults when missing", userID: "user1", wantTheme: domainpreference.ThemeSystem},
		{name: "returns stored preferences", userID: "user2", stored: stored, wantTheme: domainpreference.ThemeDark},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			preferenceRepo := newUserPreferenceRepoMock()
			if tt.stored != nil {
				if err := preferenceRepo.Upsert(context.Background(), tt.stored); err != nil {
					t.Fatalf("seed preferences: %v", err)
				}
			}
			service := NewUserPreferenceService(preferenceRepo, newWorkspaceRoleRepo())

			got, err := service.Get(context.Background(), tt.userID)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got.UserID != tt.userID {
				t.Fatalf("want user %q, got %q", tt.userID, got.UserID)
			}
			if got.Theme != tt.wantTheme {
				t.Fatalf("want theme %q, got %q", tt.wantTheme, got.Theme)
			}
		})
	}
}

func TestUserPreferenceServicePatch(t *testing.T) {
	assignOff := false
	dueOn := true
	defaultWorkspace := "ws1"

	tests := []struct {
		name       string
		roles      map[string]map[string]workspace.Role
		update     domainpreference.Update
		wantErr    error
		assertions func(t *testing.T, got *domainpreference.Preferences)
	}{
		{
			name: "round trips full settings patch",
			roles: map[string]map[string]workspace.Role{
				"ws1": {"user1": workspace.RoleMember},
			},
			update: domainpreference.Update{
				Theme:              strPtr("dark"),
				AccentColor:        strPtr("#22c55e"),
				Density:            strPtr("compact"),
				DefaultWorkspaceID: &defaultWorkspace,
				Notifications: &domainpreference.NotificationUpdate{
					EmailOnAssign:  &assignOff,
					EmailOnDueDate: &dueOn,
				},
				WeekStart: strPtr("sunday"),
				Timezone:  strPtr("Europe/Prague"),
			},
			assertions: func(t *testing.T, got *domainpreference.Preferences) {
				if got.Theme != domainpreference.ThemeDark || got.Density != domainpreference.DensityCompact {
					t.Fatalf("unexpected theme/density: %#v", got)
				}
				if got.DefaultWorkspaceID == nil || *got.DefaultWorkspaceID != "ws1" {
					t.Fatalf("default workspace not saved: %#v", got.DefaultWorkspaceID)
				}
				if got.Notifications.EmailOnAssign || !got.Notifications.EmailOnDueDate {
					t.Fatalf("notification patch not applied: %#v", got.Notifications)
				}
			},
		},
		{name: "rejects invalid theme", update: domainpreference.Update{Theme: strPtr("blue")}, wantErr: domainpreference.ErrInvalidTheme},
		{name: "rejects invalid timezone", update: domainpreference.Update{Timezone: strPtr("Not/AZone")}, wantErr: domainpreference.ErrInvalidTimezone},
		{
			name: "rejects inaccessible default workspace",
			roles: map[string]map[string]workspace.Role{
				"ws1": {"other": workspace.RoleMember},
			},
			update:  domainpreference.Update{DefaultWorkspaceID: &defaultWorkspace},
			wantErr: domainpreference.ErrDefaultWorkspaceNotAccessible,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			workspaceRepo := newWorkspaceRoleRepo()
			workspaceRepo.roles = tt.roles
			preferenceRepo := newUserPreferenceRepoMock()
			service := NewUserPreferenceService(preferenceRepo, workspaceRepo)

			got, err := service.Patch(context.Background(), "user1", tt.update)
			if tt.wantErr != nil {
				if !errors.Is(err, tt.wantErr) {
					t.Fatalf("want %v, got %v", tt.wantErr, err)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if tt.assertions != nil {
				tt.assertions(t, got)
			}

			roundTripped, err := service.Get(context.Background(), "user1")
			if err != nil {
				t.Fatalf("round trip get: %v", err)
			}
			if roundTripped.Theme != got.Theme || roundTripped.AccentColor != got.AccentColor {
				t.Fatalf("unexpected stored value: %#v", roundTripped)
			}
		})
	}
}

func clonePreferences(preferences *domainpreference.Preferences) *domainpreference.Preferences {
	clone := *preferences
	if preferences.DefaultWorkspaceID != nil {
		value := *preferences.DefaultWorkspaceID
		clone.DefaultWorkspaceID = &value
	}
	return &clone
}

func strPtr(value string) *string {
	return &value
}
