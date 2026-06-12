package events

import "time"

const WorkspaceMutationEventName = "workspace.mutation"

type WorkspaceMutationEvent struct {
	Type        string
	WorkspaceID string
	Payload     interface{}
	ActorID     string
	OccurredAt  time.Time
}

func (WorkspaceMutationEvent) Name() string {
	return WorkspaceMutationEventName
}
