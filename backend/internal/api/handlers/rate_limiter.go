package handlers

import (
	"sync"
	"time"
)

type rateLimiter struct {
	mu       sync.Mutex
	limit    int
	window   time.Duration
	requests map[string][]time.Time
}

func newRateLimiter(limit int, window time.Duration) *rateLimiter {
	return &rateLimiter{
		limit:    limit,
		window:   window,
		requests: make(map[string][]time.Time),
	}
}

func (r *rateLimiter) Allow(key string) bool {
	now := time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	timestamps := r.requests[key]
	cutoff := now.Add(-r.window)
	pruned := timestamps[:0]
	for _, ts := range timestamps {
		if ts.After(cutoff) {
			pruned = append(pruned, ts)
		}
	}

	if len(pruned) >= r.limit {
		r.requests[key] = pruned
		return false
	}

	pruned = append(pruned, now)
	r.requests[key] = pruned
	return true
}
