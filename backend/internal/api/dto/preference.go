package dto

import domainpreference "github.com/Star1ex/starlex-site/internal/domain/preference"

type NotificationPreferencesResponse struct {
	EmailOnAssign  bool `json:"email_on_assign"`
	EmailOnMention bool `json:"email_on_mention"`
	EmailOnInvite  bool `json:"email_on_invite"`
	EmailOnDueDate bool `json:"email_on_due_date"`
}

type UserPreferencesResponse struct {
	Theme              string                          `json:"theme"`
	AccentColor        string                          `json:"accent_color"`
	Density            string                          `json:"density"`
	DefaultWorkspaceID *string                         `json:"default_workspace_id"`
	Notifications      NotificationPreferencesResponse `json:"notifications"`
	WeekStart          string                          `json:"week_start"`
	Timezone           string                          `json:"timezone"`
}

type PatchNotificationPreferencesRequest struct {
	EmailOnAssign  *bool `json:"email_on_assign"`
	EmailOnMention *bool `json:"email_on_mention"`
	EmailOnInvite  *bool `json:"email_on_invite"`
	EmailOnDueDate *bool `json:"email_on_due_date"`
}

type PatchUserPreferencesRequest struct {
	Theme              *string                              `json:"theme"`
	AccentColor        *string                              `json:"accent_color"`
	Density            *string                              `json:"density"`
	DefaultWorkspaceID *string                              `json:"default_workspace_id"`
	Notifications      *PatchNotificationPreferencesRequest `json:"notifications"`
	WeekStart          *string                              `json:"week_start"`
	Timezone           *string                              `json:"timezone"`
}

func ToUserPreferencesResponse(preferences *domainpreference.Preferences) UserPreferencesResponse {
	return UserPreferencesResponse{
		Theme:              string(preferences.Theme),
		AccentColor:        preferences.AccentColor,
		Density:            string(preferences.Density),
		DefaultWorkspaceID: preferences.DefaultWorkspaceID,
		Notifications: NotificationPreferencesResponse{
			EmailOnAssign:  preferences.Notifications.EmailOnAssign,
			EmailOnMention: preferences.Notifications.EmailOnMention,
			EmailOnInvite:  preferences.Notifications.EmailOnInvite,
			EmailOnDueDate: preferences.Notifications.EmailOnDueDate,
		},
		WeekStart: string(preferences.WeekStart),
		Timezone:  preferences.Timezone,
	}
}

func FromPatchUserPreferencesRequest(req PatchUserPreferencesRequest) domainpreference.Update {
	update := domainpreference.Update{
		Theme:              req.Theme,
		AccentColor:        req.AccentColor,
		Density:            req.Density,
		DefaultWorkspaceID: req.DefaultWorkspaceID,
		WeekStart:          req.WeekStart,
		Timezone:           req.Timezone,
	}
	if req.Notifications != nil {
		update.Notifications = &domainpreference.NotificationUpdate{
			EmailOnAssign:  req.Notifications.EmailOnAssign,
			EmailOnMention: req.Notifications.EmailOnMention,
			EmailOnInvite:  req.Notifications.EmailOnInvite,
			EmailOnDueDate: req.Notifications.EmailOnDueDate,
		}
	}
	return update
}
