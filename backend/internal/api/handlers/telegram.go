package handlers

import (
	"fmt"
	"html"

	"github.com/Star1ex/starlex-site/internal/events"
	"github.com/Star1ex/starlex-site/internal/logger"
	"github.com/Star1ex/starlex-site/internal/notifications/telegram"
)

func UserRegisteredTelegramHandler(tg *telegram.Client) events.Handler {
	return func(e events.Event) {
		if tg == nil {
			logger.Log.Warnw("telegram handler disabled: nil client")
			return
		}

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
			html.EscapeString(event.UserID),
			html.EscapeString(event.Email),
			html.EscapeString(event.FirstName),
			html.EscapeString(event.LastName),
		)

		if err := tg.Send(msg); err != nil {
			logger.Log.Errorw("telegram send error", "error", err)
		}
	}
}

func UserLoginTelegramHandler(tg *telegram.Client) events.Handler {
	return func(e events.Event) {
		if tg == nil {
			logger.Log.Warnw("telegram handler disabled: nil client")
			return
		}

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
			html.EscapeString(event.UserID),
			html.EscapeString(event.Email),
			html.EscapeString(event.FirstName),
			html.EscapeString(event.LastName),
		)

		if err := tg.Send(msg); err != nil {
			logger.Log.Errorw("telegram send error", "error", err)
		}
	}
}
