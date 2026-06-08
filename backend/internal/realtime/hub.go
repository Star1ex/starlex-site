package realtime

import (
	"sync"
	"time"

	"github.com/Star1ex/starlex-site/internal/events"
	"github.com/gofiber/contrib/websocket"
)

const sendBufferSize = 64

type Envelope struct {
	Type        string      `json:"type"`
	WorkspaceID string      `json:"workspace_id"`
	Payload     interface{} `json:"payload"`
	ActorID     string      `json:"actor_id"`
	TS          time.Time   `json:"ts"`
}

type Hub struct {
	mu         sync.RWMutex
	workspaces map[string]map[*Client]struct{}
}

func NewHub() *Hub {
	return &Hub{workspaces: map[string]map[*Client]struct{}{}}
}

func (h *Hub) Register(client *Client) {
	h.mu.Lock()
	if _, ok := h.workspaces[client.WorkspaceID]; !ok {
		h.workspaces[client.WorkspaceID] = map[*Client]struct{}{}
	}
	h.workspaces[client.WorkspaceID][client] = struct{}{}
	h.mu.Unlock()
	h.BroadcastPresence(client.WorkspaceID)
}

func (h *Hub) Unregister(client *Client) {
	h.mu.Lock()
	clients, ok := h.workspaces[client.WorkspaceID]
	if ok {
		if _, exists := clients[client]; exists {
			delete(clients, client)
			close(client.Send)
		}
		if len(clients) == 0 {
			delete(h.workspaces, client.WorkspaceID)
		}
	}
	h.mu.Unlock()
	h.BroadcastPresence(client.WorkspaceID)
}

func (h *Hub) Broadcast(workspaceID string, envelope Envelope) {
	envelope.WorkspaceID = workspaceID
	if envelope.TS.IsZero() {
		envelope.TS = time.Now().UTC()
	}

	h.mu.RLock()
	clients := make([]*Client, 0, len(h.workspaces[workspaceID]))
	for client := range h.workspaces[workspaceID] {
		clients = append(clients, client)
	}
	h.mu.RUnlock()

	for _, client := range clients {
		select {
		case client.Send <- envelope:
		default:
			h.Unregister(client)
		}
	}
}

func (h *Hub) BroadcastPresence(workspaceID string) {
	h.Broadcast(workspaceID, Envelope{
		Type: "presence.sync",
		Payload: map[string][]string{
			"member_ids": h.Presence(workspaceID),
		},
	})
}

func (h *Hub) Presence(workspaceID string) []string {
	h.mu.RLock()
	defer h.mu.RUnlock()

	seen := map[string]struct{}{}
	for client := range h.workspaces[workspaceID] {
		seen[client.UserID] = struct{}{}
	}
	ids := make([]string, 0, len(seen))
	for id := range seen {
		ids = append(ids, id)
	}
	return ids
}

func NewClient(conn *websocket.Conn, hub *Hub, workspaceID, userID string) *Client {
	return &Client{
		Conn:        conn,
		Hub:         hub,
		WorkspaceID: workspaceID,
		UserID:      userID,
		Send:        make(chan Envelope, sendBufferSize),
	}
}

func WorkspaceMutationHandler(hub *Hub) events.Handler {
	return func(event events.Event) {
		mutation, ok := event.(events.WorkspaceMutationEvent)
		if !ok || hub == nil || mutation.WorkspaceID == "" {
			return
		}
		hub.Broadcast(mutation.WorkspaceID, Envelope{
			Type:        mutation.Type,
			WorkspaceID: mutation.WorkspaceID,
			Payload:     mutation.Payload,
			ActorID:     mutation.ActorID,
			TS:          mutation.OccurredAt,
		})
	}
}
