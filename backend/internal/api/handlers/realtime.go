package handlers

import "github.com/Star1ex/starlex-site/internal/realtime"

// broadcast pushes a workspace-scoped realtime event to every connected client
// in that workspace. It is a no-op when realtime is disabled or the workspace
// id is empty, so call sites stay branch-free.
//
// Payloads carry the full DTO (project/task/workspace) or a partial patch
// ({"id": …, "<field>": …}) that the client merges by id — either way the UI
// updates without a refetch.
func (h *Handlers) broadcast(workspaceID, actorID, eventType string, payload any) {
	if h.realtimeHub == nil || workspaceID == "" {
		return
	}
	h.realtimeHub.Broadcast(workspaceID, realtime.Envelope{
		Type:        eventType,
		WorkspaceID: workspaceID,
		Payload:     payload,
		ActorID:     actorID,
	})
}
