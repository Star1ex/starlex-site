package preference

import "context"

type Service interface {
	Get(ctx context.Context, userID string) (*Preferences, error)
	Patch(ctx context.Context, userID string, update Update) (*Preferences, error)
}
