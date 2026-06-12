package project

import "testing"

func TestPriorityValid(t *testing.T) {
	tests := []struct {
		name string
		in   Priority
		want bool
	}{
		{"none", PriorityNone, true},
		{"urgent", PriorityUrgent, true},
		{"high", PriorityHigh, true},
		{"medium", PriorityMedium, true},
		{"low", PriorityLow, true},
		{"empty", Priority(""), false},
		{"unknown", Priority("critical"), false},
		{"wrong case", Priority("High"), false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.in.Valid(); got != tt.want {
				t.Errorf("Priority(%q).Valid() = %v, want %v", tt.in, got, tt.want)
			}
		})
	}
}

func TestDefaultPriorityIsValid(t *testing.T) {
	if !DefaultPriority.Valid() {
		t.Errorf("DefaultPriority %q must be valid", DefaultPriority)
	}
}
