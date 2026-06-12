package storage

import "testing"

func TestNormalizeObjectKeyRejectsUnsafeValues(t *testing.T) {
	t.Parallel()

	cases := []string{
		"",
		" ",
		"../avatar.png",
		"/../avatar.png",
		"..\\avatar.png",
		"avatars/\x00/file.png",
	}

	for _, tc := range cases {
		if _, err := normalizeObjectKey(tc); err == nil {
			t.Fatalf("normalizeObjectKey(%q) expected error", tc)
		}
	}
}

func TestObjectURLForKeyEscapesPathSegments(t *testing.T) {
	t.Parallel()

	got, err := objectURL("https://cdn.example.com/assets", "avatars/user 1/avatar+new.png")
	if err != nil {
		t.Fatalf("objectURL returned error: %v", err)
	}

	want := "https://cdn.example.com/assets/avatars/user%201/avatar+new.png"
	if got != want {
		t.Fatalf("objectURL = %q, want %q", got, want)
	}
}

func TestObjectKeyFromReferenceTrimsAbsoluteBaseURL(t *testing.T) {
	t.Parallel()

	got, err := objectKeyFromReference(
		"https://cdn.example.com/assets/avatars/user%201/avatar.png",
		"https://cdn.example.com/assets",
	)
	if err != nil {
		t.Fatalf("objectKeyFromReference returned error: %v", err)
	}

	want := "avatars/user 1/avatar.png"
	if got != want {
		t.Fatalf("objectKeyFromReference = %q, want %q", got, want)
	}
}

func TestObjectKeyFromReferenceTrimsRelativeBaseURL(t *testing.T) {
	t.Parallel()

	got, err := objectKeyFromReference("/uploads/avatars/user/avatar.png", "/uploads/")
	if err != nil {
		t.Fatalf("objectKeyFromReference returned error: %v", err)
	}

	want := "avatars/user/avatar.png"
	if got != want {
		t.Fatalf("objectKeyFromReference = %q, want %q", got, want)
	}
}
