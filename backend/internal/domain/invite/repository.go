package invite

import (
	"context"
	"time"
)

type Repository interface {
	Create(ctx context.Context, invite *Invite) error
	FindByToken(ctx context.Context, token string) (*Invite, error)
	FindByID(ctx context.Context, id string) (*Invite, error)
	ListByWorkspace(ctx context.Context, workspaceID string) ([]*Invite, error)
	Consume(ctx context.Context, token string, now time.Time) (*Invite, error)
	Revoke(ctx context.Context, id string, revokedAt time.Time) error
}
