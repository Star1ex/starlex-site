package entity

import "time"

type Discussion struct {
	ID          string
	Title       string
	TaskID      *string
	FolderID    *string
	WorkspaceID *string
	CreatedBy   string
	IsResolved  bool
	CreatedAt   time.Time
	UpdatedAt   time.Time
	Messages    []*DiscussionMessage
}

type DiscussionMessage struct {
	ID           string
	DiscussionID string
	AuthorID     string
	Content      string
	ContentType  string // "markdown" | "blocknote"
	Author       *User
	CreatedAt    time.Time
	UpdatedAt    time.Time
}
