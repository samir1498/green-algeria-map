package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

type brevoRecipient struct {
	Email string `json:"email"`
}

type brevoSender struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type brevoPayload struct {
	Sender  brevoSender      `json:"sender"`
	To      []brevoRecipient `json:"to"`
	Subject string           `json:"subject"`
	HTML    string           `json:"html"`
}

// Client sends transactional emails via the Brevo v3 SMTP API.
type Client struct {
	apiKey    string
	fromEmail string
	fromName  string
	http      *http.Client
}

// SentHTML captures the HTML of every email "sent" while MOCK_EMAIL is enabled.
// Integration tests read it to extract verification / reset links without
// touching the real Brevo API.
var SentHTML []string

// LastSentHTML returns the most recently captured email body (empty unless
// MOCK_EMAIL is set).
func LastSentHTML() string {
	if len(SentHTML) == 0 {
		return ""
	}
	return SentHTML[len(SentHTML)-1]
}

// NewClient builds a Brevo client reading configuration from the environment.
func NewClient() *Client {
	fromEmail := os.Getenv("FROM_EMAIL")
	if fromEmail == "" {
		fromEmail = "noreply@greenalgeria.org"
	}
	fromName := os.Getenv("FROM_NAME")
	if fromName == "" {
		fromName = "Green Algeria Map"
	}
	return &Client{
		apiKey:    os.Getenv("BREVO_API_KEY"),
		fromEmail: fromEmail,
		fromName:  fromName,
		http:      &http.Client{Timeout: 10 * time.Second},
	}
}

// Send delivers an email through Brevo.
func (c *Client) Send(to, subject, html string) error {
	// In test environments email delivery is disabled: the caller only needs to
	// know the send was attempted, not actually reach Brevo.
	if os.Getenv("MOCK_EMAIL") == "1" {
		SentHTML = append(SentHTML, html)
		return nil
	}
	if c.apiKey == "" {
		return fmt.Errorf("BREVO_API_KEY is not set")
	}
	payload := brevoPayload{
		Sender:  brevoSender{Name: c.fromName, Email: c.fromEmail},
		To:      []brevoRecipient{{Email: to}},
		Subject: subject,
		HTML:    html,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal email payload: %w", err)
	}
	req, err := http.NewRequest(http.MethodPost, "https://api.brevo.com/v3/smtp/email", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("build email request: %w", err)
	}
	req.Header.Set("api-key", c.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("accept", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("send email: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return fmt.Errorf("brevo returned status %d", resp.StatusCode)
	}
	return nil
}
