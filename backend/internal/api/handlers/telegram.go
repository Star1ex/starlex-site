package handlers

import (
	"fmt"

	"github.com/Team-Tracks/team-track-site/internal/events"
	"github.com/Team-Tracks/team-track-site/internal/notifications/telegram"
)

func UserRegisteredTelegramHandler(tg *telegram.Client) events.Handler {
	return func(e events.Event) {
		event := e.(events.UserRegisteredEvent)

		msg := fmt.Sprintf(
			"New user registered</b>\n\n"+
				"%s\n"+
				"%s\n"+
				"%s\n"+
				"%s\n",
			event.UserID,
			event.Email,
			event.FirstName,
			event.LastName,
		)
		_ = tg.Send(msg)
	}
}
