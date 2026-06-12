package preference

import (
	"errors"
	"time"
)

type Theme string

const (
	ThemeSystem Theme = "system"
	ThemeLight  Theme = "light"
	ThemeDark   Theme = "dark"
)

type Density string

const (
	DensityComfortable Density = "comfortable"
	DensityCompact     Density = "compact"
)

type WeekStart string

const (
	WeekStartMonday WeekStart = "monday"
	WeekStartSunday WeekStart = "sunday"
)

var (
	ErrPreferencesNotFound           = errors.New("preference: not found")
	ErrInvalidTheme                  = errors.New("preference: invalid theme")
	ErrInvalidAccentColor            = errors.New("preference: invalid accent color")
	ErrInvalidDensity                = errors.New("preference: invalid density")
	ErrInvalidWeekStart              = errors.New("preference: invalid week start")
	ErrInvalidTimezone               = errors.New("preference: invalid timezone")
	ErrDefaultWorkspaceNotAccessible = errors.New("preference: default workspace is not accessible")
)

type NotificationPreferences struct {
	EmailOnAssign  bool
	EmailOnMention bool
	EmailOnInvite  bool
	EmailOnDueDate bool
}

type Preferences struct {
	UserID             string
	Theme              Theme
	AccentColor        string
	Density            Density
	DefaultWorkspaceID *string
	Notifications      NotificationPreferences
	WeekStart          WeekStart
	Timezone           string
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

type NotificationUpdate struct {
	EmailOnAssign  *bool
	EmailOnMention *bool
	EmailOnInvite  *bool
	EmailOnDueDate *bool
}

type Update struct {
	Theme              *string
	AccentColor        *string
	Density            *string
	DefaultWorkspaceID *string
	Notifications      *NotificationUpdate
	WeekStart          *string
	Timezone           *string
}

func DefaultPreferences(userID string) *Preferences {
	return &Preferences{
		UserID:      userID,
		Theme:       ThemeSystem,
		AccentColor: "#6366f1",
		Density:     DensityComfortable,
		Notifications: NotificationPreferences{
			EmailOnAssign:  true,
			EmailOnMention: true,
			EmailOnInvite:  true,
			EmailOnDueDate: false,
		},
		WeekStart: WeekStartMonday,
		Timezone:  "UTC",
	}
}

func ParseTheme(value string) (Theme, error) {
	theme := Theme(value)
	if theme == "" {
		return ThemeSystem, nil
	}
	if !theme.Valid() {
		return "", ErrInvalidTheme
	}
	return theme, nil
}

func (t Theme) Valid() bool {
	switch t {
	case ThemeSystem, ThemeLight, ThemeDark:
		return true
	default:
		return false
	}
}

func ParseDensity(value string) (Density, error) {
	density := Density(value)
	if density == "" {
		return DensityComfortable, nil
	}
	if !density.Valid() {
		return "", ErrInvalidDensity
	}
	return density, nil
}

func (d Density) Valid() bool {
	switch d {
	case DensityComfortable, DensityCompact:
		return true
	default:
		return false
	}
}

func ParseWeekStart(value string) (WeekStart, error) {
	weekStart := WeekStart(value)
	if weekStart == "" {
		return WeekStartMonday, nil
	}
	if !weekStart.Valid() {
		return "", ErrInvalidWeekStart
	}
	return weekStart, nil
}

func (w WeekStart) Valid() bool {
	switch w {
	case WeekStartMonday, WeekStartSunday:
		return true
	default:
		return false
	}
}
