package label

import "context"

type Service interface {
	Create(ctx context.Context, workspaceID, name, color, requesterID string) (*Label, error)
	ListByWorkspace(ctx context.Context, workspaceID, requesterID string) ([]*Label, error)
	Update(ctx context.Context, id string, name *string, color *string, requesterID string) (*Label, error)
	Delete(ctx context.Context, id, requesterID string) error
}
