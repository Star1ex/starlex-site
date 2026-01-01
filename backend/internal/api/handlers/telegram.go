package handlers

import (
	"fmt"
	"log"

	"github.com/Team-Tracks/team-track-site/internal/events"
	"github.com/Team-Tracks/team-track-site/internal/notifications/telegram"
)

func UserRegisteredTelegramHandler(tg *telegram.Client) events.Handler {
	return func(e events.Event) {

		event, ok := e.(events.UserRegisteredEvent)
		if !ok {
			log.Println("telegram handler: wrong event type")
			return
		}

		msg := fmt.Sprintf(
			"<b>New user registered</b>\n\n"+
				"ID: %s\n"+
				"Email: %s\n"+
				"First name: %s\n"+
				"Last name: %s",
			event.UserID,
			event.Email,
			event.FirstName,
			event.LastName,
		)

		if err := tg.Send(msg); err != nil {
			log.Println("telegram send error:", err)
		}
	}
}

func UserLoginTelegramHandler(tg *telegram.Client) events.Handler {
	return func(e events.Event) {
		event, ok := e.(events.UserLoginEvent)
		if !ok {
			log.Println("telegram handler: wrong event type")
			return
		}

		msg := fmt.Sprintf(
			"<b>User logged in</b>\n\n"+
				"ID: %s\n"+
				"Email: %s\n"+
				"First name: %s\n"+
				"Last name: %s",
			event.UserID,
			event.Email,
			event.FirstName,
			event.LastName,
		)

		if err := tg.Send(msg); err != nil {
			log.Println("telegram send error:", err)
		}
	}
}
