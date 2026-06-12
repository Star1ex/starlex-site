package invite

import (
	"context"

	"github.com/Star1ex/starlex-site/internal/domain/entity"
)

type Service interface {
	Create(ctx context.Context, workspaceID, role, requesterID string, expiresInHours *int, maxUses *int) (*Invite, error)
	Preview(ctx context.Context, token string) (*entity.Workspace, bool, error)
	Accept(ctx context.Context, token, userID string) (*entity.Workspace, error)
	ListByWorkspace(ctx context.Context, workspaceID, requesterID string) ([]*Invite, error)
	Revoke(ctx context.Context, id, requesterID string) error
}
