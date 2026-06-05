package project

import "testing"

func TestStatusValid(t *testing.T) {
	tests := []struct {
		name string
		in   Status
		want bool
	}{
		{"backlog", StatusBacklog, true},
		{"planned", StatusPlanned, true},
		{"in_progress", StatusInProgress, true},
		{"paused", StatusPaused, true},
		{"completed", StatusCompleted, true},
		{"cancelled", StatusCancelled, true},
		{"empty", Status(""), false},
		{"unknown", Status("archived"), false},
		{"wrong case", Status("Backlog"), false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.in.Valid(); got != tt.want {
				t.Errorf("Status(%q).Valid() = %v, want %v", tt.in, got, tt.want)
			}
		})
	}
}

func TestStatusString(t *testing.T) {
	if StatusInProgress.String() != "in_progress" {
		t.Errorf("unexpected string: %q", StatusInProgress.String())
	}
}

func TestDefaultStatusIsValid(t *testing.T) {
	if !DefaultStatus.Valid() {
		t.Errorf("DefaultStatus %q must be valid", DefaultStatus)
	}
}
