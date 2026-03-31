package handlers

import (
	"fmt"

	"github.com/Team-Tracks/team-track-site/internal/events"
	"github.com/Team-Tracks/team-track-site/internal/logger"
	"github.com/Team-Tracks/team-track-site/internal/notifications/telegram"
)

func UserRegisteredTelegramHandler(tg *telegram.Client) events.Handler {
	return func(e events.Event) {

		event, ok := e.(events.UserRegisteredEvent)
		if !ok {
			logger.Log.Warnw("telegram handler: wrong event type")
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
			logger.Log.Errorw("telegram send error", "error", err)
		}
	}
}

func UserLoginTelegramHandler(tg *telegram.Client) events.Handler {
	return func(e events.Event) {
		event, ok := e.(events.UserLoginEvent)
		if !ok {
			logger.Log.Warnw("telegram handler: wrong event type")
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
			logger.Log.Errorw("telegram send error", "error", err)
		}
	}
}
