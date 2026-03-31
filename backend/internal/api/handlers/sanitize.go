package handlers

import "github.com/microcosm-cc/bluemonday"

// strictPolicy strips all HTML. Use for plain text fields (titles, names).
var strictPolicy = bluemonday.StrictPolicy()

// markdownPolicy allows safe markdown-rendered HTML. Use for description fields.
var markdownPolicy = bluemonday.UGCPolicy()

func sanitizeStrict(s string) string  { return strictPolicy.Sanitize(s) }
func sanitizeMarkdown(s string) string { return markdownPolicy.Sanitize(s) }
