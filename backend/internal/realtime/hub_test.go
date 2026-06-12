package realtime

import "testing"

func TestHubBroadcastScopesByWorkspace(t *testing.T) {
	hub := NewHub()
	ws1 := &Client{WorkspaceID: "ws1", UserID: "u1", Send: make(chan Envelope, 4)}
	ws2 := &Client{WorkspaceID: "ws2", UserID: "u2", Send: make(chan Envelope, 4)}
	hub.Register(ws1)
	hub.Register(ws2)

	hub.Broadcast("ws1", Envelope{Type: "task.created", ActorID: "u1"})

	for {
		select {
		case got := <-ws1.Send:
			if got.Type == "task.created" {
				if got.WorkspaceID != "ws1" {
					t.Fatalf("want workspace ws1, got %q", got.WorkspaceID)
				}
				return
			}
		default:
			t.Fatalf("ws1 did not receive task.created")
		}
	}
}

func TestHubPresenceDeduplicatesMembers(t *testing.T) {
	hub := NewHub()
	hub.Register(&Client{WorkspaceID: "ws1", UserID: "u1", Send: make(chan Envelope, 4)})
	hub.Register(&Client{WorkspaceID: "ws1", UserID: "u1", Send: make(chan Envelope, 4)})
	hub.Register(&Client{WorkspaceID: "ws1", UserID: "u2", Send: make(chan Envelope, 4)})

	got := hub.Presence("ws1")
	if len(got) != 2 {
		t.Fatalf("want 2 unique members, got %d: %#v", len(got), got)
	}
}
