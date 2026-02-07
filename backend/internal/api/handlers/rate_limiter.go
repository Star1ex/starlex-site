package handlers

import (
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
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
func createAuthRateLimiter() fiber.Handler {
	limiter := newRateLimiter(5, time.Minute*15)
	return func(c *fiber.Ctx) error {
		key := c.IP()
		if !limiter.Allow(key) {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "too many attempts, please try again later",
			})
		}
		return c.Next()
	}
}

func CreateAuthRateLimiter() fiber.Handler {
	return createAuthRateLimiter()
}
