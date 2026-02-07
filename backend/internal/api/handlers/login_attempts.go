package handlers

import (
	"sync"
	"time"
)

type loginAttempts struct {
	mu       sync.RWMutex
	attempts map[string]*attemptRecord
}

type attemptRecord struct {
	count     int
	expiresAt time.Time
}

var globalAttempts = &loginAttempts{
	attempts: make(map[string]*attemptRecord),
}

func getLoginAttempts(key string) (int, error) {
	globalAttempts.mu.RLock()
	defer globalAttempts.mu.RUnlock()

	record, exists := globalAttempts.attempts[key]
	if !exists || time.Now().After(record.expiresAt) {
		return 0, nil
	}
	return record.count, nil
}

func incrementLoginAttempts(key string, duration time.Duration) {
	globalAttempts.mu.Lock()
	defer globalAttempts.mu.Unlock()

	record, exists := globalAttempts.attempts[key]
	if !exists || time.Now().After(record.expiresAt) {
		globalAttempts.attempts[key] = &attemptRecord{
			count:     1,
			expiresAt: time.Now().Add(duration),
		}
		return
	}
	record.count++
}

func clearLoginAttempts(key string) {
	globalAttempts.mu.Lock()
	defer globalAttempts.mu.Unlock()
	delete(globalAttempts.attempts, key)
}

func init() {
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		for range ticker.C {
			globalAttempts.mu.Lock()
			now := time.Now()
			for key, record := range globalAttempts.attempts {
				if now.After(record.expiresAt) {
					delete(globalAttempts.attempts, key)
				}
			}
			globalAttempts.mu.Unlock()
		}
	}()
}
