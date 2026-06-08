package invite

import (
	"errors"
	"time"
)

var (
	ErrInviteNotFound       = errors.New("invite: not found")
	ErrInviteExpired        = errors.New("invite: expired")
	ErrInviteRevoked        = errors.New("invite: revoked")
	ErrInviteMaxUsesReached = errors.New("invite: max uses reached")
)

type Invite struct {
	ID          string
	WorkspaceID string
	Token       string
	Role        string
	CreatedBy   string
	ExpiresAt   *time.Time
	MaxUses     *int
	UseCount    int
	RevokedAt   *time.Time
	CreatedAt   time.Time
}

func (i *Invite) Valid(now time.Time) bool {
	return i.InvalidReason(now) == nil
}

func (i *Invite) InvalidReason(now time.Time) error {
	if i == nil {
		return ErrInviteNotFound
	}
	if i.RevokedAt != nil {
		return ErrInviteRevoked
	}
	if i.ExpiresAt != nil && !now.Before(*i.ExpiresAt) {
		return ErrInviteExpired
	}
	if i.MaxUses != nil && i.UseCount >= *i.MaxUses {
		return ErrInviteMaxUsesReached
	}
	return nil
}
