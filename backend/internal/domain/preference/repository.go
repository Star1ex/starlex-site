package preference

import "context"

type Repository interface {
	Get(ctx context.Context, userID string) (*Preferences, error)
	Upsert(ctx context.Context, preferences *Preferences) error
}
