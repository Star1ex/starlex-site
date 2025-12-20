package telegram

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"time"
)

type Client struct {
	token  string
	chatID string
	client *http.Client
}

// function for init new bot
func New(token, chatID string) (*Client, error) {
	if token == "" || chatID == "" {
		return nil, errors.New("telegram: token or chatID missing")
	}
	return &Client{
		token:  token,
		chatID: chatID,
		client: &http.Client{
			Timeout: 5 * time.Second,
		},
	}, nil
}

// sending a request with token, chatID, text to bot
func (c *Client) Send(text string) error {
	url := "https://api.telegram.org/bot" + c.token + "/sendMessage"

	body, err := json.Marshal(map[string]string{
		"chat_id":    c.chatID,
		"text":       text,
		"parse_mode": "HTML",
	})
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")

	_, err = c.client.Do(req)

	return err
}
