package repository

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	domainpreference "github.com/Star1ex/starlex-site/internal/domain/preference"
	"gorm.io/datatypes"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type UserPreferenceModel struct {
	UserID             string         `gorm:"primaryKey"`
	Theme              string         `gorm:"not null;default:'system'"`
	AccentColor        string         `gorm:"not null;default:'#6366f1'"`
	Density            string         `gorm:"not null;default:'comfortable'"`
	DefaultWorkspaceID *string        `gorm:"default:null;index"`
	Notifications      datatypes.JSON `gorm:"type:jsonb;default:'{}'"`
	WeekStart          string         `gorm:"not null;default:'monday'"`
	Timezone           string         `gorm:"not null;default:'UTC'"`
	CreatedAt          time.Time      `gorm:"autoCreateTime"`
	UpdatedAt          time.Time      `gorm:"autoUpdateTime"`
	User               UserModel      `gorm:"foreignKey:UserID"`
}

type UserPreferenceRepository struct {
	db *gorm.DB
}

func NewUserPreferenceRepository(db *gorm.DB) *UserPreferenceRepository {
	return &UserPreferenceRepository{db: db}
}

func fromPreferenceDomain(preferences *domainpreference.Preferences) *UserPreferenceModel {
	return &UserPreferenceModel{
		UserID:             preferences.UserID,
		Theme:              string(preferences.Theme),
		AccentColor:        preferences.AccentColor,
		Density:            string(preferences.Density),
		DefaultWorkspaceID: preferences.DefaultWorkspaceID,
		Notifications:      marshalPreferenceNotifications(preferences.Notifications),
		WeekStart:          string(preferences.WeekStart),
		Timezone:           preferences.Timezone,
		CreatedAt:          preferences.CreatedAt,
		UpdatedAt:          preferences.UpdatedAt,
	}
}

func toPreferenceDomain(model *UserPreferenceModel) *domainpreference.Preferences {
	preferences := domainpreference.DefaultPreferences(model.UserID)
	preferences.Theme = domainpreference.Theme(model.Theme)
	preferences.AccentColor = model.AccentColor
	preferences.Density = domainpreference.Density(model.Density)
	preferences.DefaultWorkspaceID = model.DefaultWorkspaceID
	preferences.Notifications = unmarshalPreferenceNotifications(model.Notifications)
	preferences.WeekStart = domainpreference.WeekStart(model.WeekStart)
	preferences.Timezone = model.Timezone
	preferences.CreatedAt = model.CreatedAt
	preferences.UpdatedAt = model.UpdatedAt
	return preferences
}

func (r *UserPreferenceRepository) Get(ctx context.Context, userID string) (*domainpreference.Preferences, error) {
	var model UserPreferenceModel
	err := r.db.WithContext(ctx).First(&model, "user_id = ?", userID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domainpreference.ErrPreferencesNotFound
		}
		return nil, err
	}
	return toPreferenceDomain(&model), nil
}

func (r *UserPreferenceRepository) Upsert(ctx context.Context, preferences *domainpreference.Preferences) error {
	model := fromPreferenceDomain(preferences)
	return r.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "user_id"}},
			DoUpdates: clause.AssignmentColumns([]string{
				"theme",
				"accent_color",
				"density",
				"default_workspace_id",
				"notifications",
				"week_start",
				"timezone",
				"updated_at",
			}),
		}).
		Create(model).Error
}

func marshalPreferenceNotifications(notifications domainpreference.NotificationPreferences) datatypes.JSON {
	data, err := json.Marshal(map[string]bool{
		"email_on_assign":   notifications.EmailOnAssign,
		"email_on_mention":  notifications.EmailOnMention,
		"email_on_invite":   notifications.EmailOnInvite,
		"email_on_due_date": notifications.EmailOnDueDate,
	})
	if err != nil {
		return datatypes.JSON([]byte("{}"))
	}
	return datatypes.JSON(data)
}

func unmarshalPreferenceNotifications(data datatypes.JSON) domainpreference.NotificationPreferences {
	defaults := domainpreference.DefaultPreferences("").Notifications
	if len(data) == 0 {
		return defaults
	}
	values := map[string]bool{}
	if err := json.Unmarshal(data, &values); err != nil {
		return defaults
	}
	return domainpreference.NotificationPreferences{
		EmailOnAssign:  boolOrDefault(values, "email_on_assign", defaults.EmailOnAssign),
		EmailOnMention: boolOrDefault(values, "email_on_mention", defaults.EmailOnMention),
		EmailOnInvite:  boolOrDefault(values, "email_on_invite", defaults.EmailOnInvite),
		EmailOnDueDate: boolOrDefault(values, "email_on_due_date", defaults.EmailOnDueDate),
	}
}

func boolOrDefault(values map[string]bool, key string, fallback bool) bool {
	value, ok := values[key]
	if !ok {
		return fallback
	}
	return value
}
