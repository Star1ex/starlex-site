package label

import "context"

type Repository interface {
	Create(ctx context.Context, label *Label) error
	GetByID(ctx context.Context, id string) (*Label, error)
	ListByWorkspace(ctx context.Context, workspaceID string) ([]*Label, error)
	Update(ctx context.Context, id string, name *string, color *string) (*Label, error)
	Delete(ctx context.Context, id string) error
}
