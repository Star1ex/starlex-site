package events

import (
	"sync"

	"github.com/Star1ex/starlex-site/internal/logger"
)

type Handler func(Event)

type Bus struct {
	mu       sync.RWMutex
	handlers map[string][]Handler
}

func NewBus() *Bus {
	return &Bus{
		handlers: map[string][]Handler{},
	}
}

func (b *Bus) Subscribe(eventName string, handler Handler) {
	b.mu.Lock()
	defer b.mu.Unlock()

	b.handlers[eventName] = append(b.handlers[eventName], handler)
}

func (b *Bus) Publish(event Event) {
	b.mu.RLock()
	defer b.mu.RUnlock()

	if handlers, ok := b.handlers[event.Name()]; ok {
		for _, h := range handlers {
			go func(handler Handler) {
				defer func() {
					if recovered := recover(); recovered != nil {
						logger.Log.Errorw("event handler panic", "event", event.Name(), "panic", recovered)
					}
				}()
				handler(event)
			}(h)
		}
	}
}
