package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	domainpreference "github.com/Star1ex/starlex-site/internal/domain/preference"
	domainworkspace "github.com/Star1ex/starlex-site/internal/domain/workspace"
)

type UserPreferenceService struct {
	preferenceRepo domainpreference.Repository
	workspaceRepo  domainworkspace.Repository
}

func NewUserPreferenceService(
	preferenceRepo domainpreference.Repository,
	workspaceRepo domainworkspace.Repository,
) *UserPreferenceService {
	return &UserPreferenceService{preferenceRepo: preferenceRepo, workspaceRepo: workspaceRepo}
}

func (s *UserPreferenceService) Get(ctx context.Context, userID string) (*domainpreference.Preferences, error) {
	preferences, err := s.preferenceRepo.Get(ctx, userID)
	if err != nil {
		if errors.Is(err, domainpreference.ErrPreferencesNotFound) {
			return domainpreference.DefaultPreferences(userID), nil
		}
		return nil, fmt.Errorf("getUserPreferences: %w", err)
	}
	return preferences, nil
}

func (s *UserPreferenceService) Patch(
	ctx context.Context,
	userID string,
	update domainpreference.Update,
) (*domainpreference.Preferences, error) {
	preferences, err := s.Get(ctx, userID)
	if err != nil {
		return nil, err
	}
	if err := s.applyUpdate(ctx, preferences, update); err != nil {
		return nil, err
	}
	if err := s.preferenceRepo.Upsert(ctx, preferences); err != nil {
		return nil, fmt.Errorf("patchUserPreferences: %w", err)
	}
	return preferences, nil
}

func (s *UserPreferenceService) applyUpdate(
	ctx context.Context,
	preferences *domainpreference.Preferences,
	update domainpreference.Update,
) error {
	if err := applyPreferenceScalars(preferences, update); err != nil {
		return err
	}
	if update.DefaultWorkspaceID != nil {
		if err := s.applyDefaultWorkspace(ctx, preferences, strings.TrimSpace(*update.DefaultWorkspaceID)); err != nil {
			return err
		}
	}
	if update.Notifications != nil {
		applyNotificationUpdate(&preferences.Notifications, *update.Notifications)
	}
	return nil
}

func applyPreferenceScalars(preferences *domainpreference.Preferences, update domainpreference.Update) error {
	if update.Theme != nil {
		theme, err := domainpreference.ParseTheme(strings.TrimSpace(*update.Theme))
		if err != nil {
			return err
		}
		preferences.Theme = theme
	}
	if update.AccentColor != nil {
		color := strings.TrimSpace(*update.AccentColor)
		if !hexColorPattern.MatchString(color) {
			return domainpreference.ErrInvalidAccentColor
		}
		preferences.AccentColor = color
	}
	if update.Density != nil {
		density, err := domainpreference.ParseDensity(strings.TrimSpace(*update.Density))
		if err != nil {
			return err
		}
		preferences.Density = density
	}
	if update.WeekStart != nil {
		weekStart, err := domainpreference.ParseWeekStart(strings.TrimSpace(*update.WeekStart))
		if err != nil {
			return err
		}
		preferences.WeekStart = weekStart
	}
	if update.Timezone != nil {
		if err := applyTimezone(preferences, strings.TrimSpace(*update.Timezone)); err != nil {
			return err
		}
	}
	return nil
}

func applyTimezone(preferences *domainpreference.Preferences, timezone string) error {
	if timezone == "" {
		timezone = "UTC"
	}
	if _, err := time.LoadLocation(timezone); err != nil {
		return domainpreference.ErrInvalidTimezone
	}
	preferences.Timezone = timezone
	return nil
}

func (s *UserPreferenceService) applyDefaultWorkspace(
	ctx context.Context,
	preferences *domainpreference.Preferences,
	workspaceID string,
) error {
	if workspaceID == "" {
		preferences.DefaultWorkspaceID = nil
		return nil
	}
	if _, err := s.workspaceRepo.GetRole(ctx, workspaceID, preferences.UserID); err != nil {
		return domainpreference.ErrDefaultWorkspaceNotAccessible
	}
	preferences.DefaultWorkspaceID = &workspaceID
	return nil
}

func applyNotificationUpdate(
	notifications *domainpreference.NotificationPreferences,
	update domainpreference.NotificationUpdate,
) {
	if update.EmailOnAssign != nil {
		notifications.EmailOnAssign = *update.EmailOnAssign
	}
	if update.EmailOnMention != nil {
		notifications.EmailOnMention = *update.EmailOnMention
	}
	if update.EmailOnInvite != nil {
		notifications.EmailOnInvite = *update.EmailOnInvite
	}
	if update.EmailOnDueDate != nil {
		notifications.EmailOnDueDate = *update.EmailOnDueDate
	}
}
