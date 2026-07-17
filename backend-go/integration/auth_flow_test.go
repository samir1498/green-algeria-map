package integration

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/green-algeria-map/backend-go/internal/email"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func init() {
	os.Setenv("BETTER_AUTH_URL", "http://localhost:8080")
	os.Setenv("GOOGLE_CLIENT_ID", "test-google-client-id")
	os.Setenv("GOOGLE_CLIENT_SECRET", "test-google-client-secret")
	os.Setenv("GITHUB_CLIENT_ID", "test-github-client-id")
	os.Setenv("GITHUB_CLIENT_SECRET", "test-github-client-secret")
	os.Setenv("MOCK_EMAIL", "1")
	os.Setenv("DISABLE_RATE_LIMIT", "true")
}

// extractToken pulls the token out of a captured email body. go-better-auth
// builds both verification and reset links as `<redirectURI>?token=<token>`,
// so a single query-param marker works for either flow.
func extractToken(html string) string {
	const marker = "?token="
	i := strings.Index(html, marker)
	if i < 0 {
		return ""
	}
	start := i + len(marker)
	end := start
	for end < len(html) && html[end] != '"' && html[end] != '&' && html[end] != '<' && html[end] != ' ' {
		end++
	}
	return html[start:end]
}

func TestAuth_Flows(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	container, connStr := setupPostgresContainer(t)
	defer func() { _ = container.Terminate(context.Background()) }()

	srv := createTestServer(t, connStr)

	signUp := func(name, emailAddr, password string) *httptest.ResponseRecorder {
		body := `{"email":"` + emailAddr + `","password":"` + password + `","name":"` + name + `"}`
		return makeRequest(t, srv, "POST", "/api/auth/sign-up/email", body)
	}
	signIn := func(emailAddr, password string) *httptest.ResponseRecorder {
		body := `{"email":"` + emailAddr + `","password":"` + password + `"}`
		return makeRequest(t, srv, "POST", "/api/auth/sign-in/email", body)
	}
	sendVerification := func(emailAddr string) *httptest.ResponseRecorder {
		body := `{"email":"` + emailAddr + `","callbackURL":"http://localhost:8080"}`
		return makeRequest(t, srv, "POST", "/api/auth/send-verification-email", body)
	}
	verifyEmail := func(token string) *httptest.ResponseRecorder {
		return makeRequest(t, srv, "GET", "/api/auth/verify-email?token="+token, "")
	}
	requestReset := func(emailAddr string) *httptest.ResponseRecorder {
		body := `{"email":"` + emailAddr + `","redirectURI":"http://localhost:8080"}`
		return makeRequest(t, srv, "POST", "/api/auth/request-password-reset", body)
	}
	resetPassword := func(token, newPassword string) *httptest.ResponseRecorder {
		body := `{"token":"` + token + `","newPassword":"` + newPassword + `"}`
		return makeRequest(t, srv, "POST", "/api/auth/reset-password", body)
	}

	t.Run("sign up creates a user", func(t *testing.T) {
		w := signUp("Test User", "test@example.com", "password123")
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("duplicate email is rejected", func(t *testing.T) {
		signUp("First", "dup@example.com", "password123")
		w := signUp("Second", "dup@example.com", "password456")
		assert.GreaterOrEqual(t, w.Code, 400)
	})

	t.Run("unverified user cannot sign in", func(t *testing.T) {
		emailAddr := "unverified@example.com"
		signUp("Unverified", emailAddr, "password123")
		w := signIn(emailAddr, "password123")
		assert.Equal(t, http.StatusForbidden, w.Code)
	})

	t.Run("email verification unblocks sign in", func(t *testing.T) {
		emailAddr := "verify-flow@example.com"
		signUp("Verify Flow", emailAddr, "password123")

		email.SentHTML = nil
		w := sendVerification(emailAddr)
		assert.Equal(t, http.StatusOK, w.Code)

		html := email.LastSentHTML()
		require.NotEmpty(t, html, "verification email should have been captured")
		token := extractToken(html)
		require.NotEmpty(t, token, "verification token should be present in email")

		w = verifyEmail(token)
		assert.Equal(t, http.StatusOK, w.Code)

		w = signIn(emailAddr, "password123")
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("rejects an invalid verification token", func(t *testing.T) {
		w := verifyEmail("not-a-real-token")
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("password reset works end to end", func(t *testing.T) {
		emailAddr := "reset-flow@example.com"
		signUp("Reset Flow", emailAddr, "password123")

		// Verify first so the account is allowed to sign in afterwards.
		email.SentHTML = nil
		sendVerification(emailAddr)
		verifyEmail(extractToken(email.LastSentHTML()))

		email.SentHTML = nil
		w := requestReset(emailAddr)
		assert.Equal(t, http.StatusOK, w.Code)

		html := email.LastSentHTML()
		require.NotEmpty(t, html, "reset email should have been captured")
		token := extractToken(html)
		require.NotEmpty(t, token, "reset token should be present in email")

		w = resetPassword(token, "brandNewPass456")
		assert.Equal(t, http.StatusOK, w.Code)

		// New password works.
		w = signIn(emailAddr, "brandNewPass456")
		assert.Equal(t, http.StatusOK, w.Code)

		// Old password no longer works.
		w = signIn(emailAddr, "password123")
		assert.GreaterOrEqual(t, w.Code, 400)
	})

	t.Run("invalid reset token is rejected", func(t *testing.T) {
		w := resetPassword("not-a-real-token", "whatever123")
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("get session returns null without cookie", func(t *testing.T) {
		w := makeRequest(t, srv, "GET", "/api/auth/get-session", "")
		assert.Equal(t, http.StatusOK, w.Code)
		var resp map[string]interface{}
		require.NoError(t, json.NewDecoder(w.Body).Decode(&resp))
		assert.Nil(t, resp["user"])
	})

	t.Run("OAuth redirects to Google", func(t *testing.T) {
		w := makeRequest(t, srv, "GET",
			"/api/auth/sign-in/google?callbackURL=http://localhost:3000", "")
		assert.Equal(t, http.StatusFound, w.Code)
		assert.Contains(t, w.Header().Get("Location"), "accounts.google.com")
	})

	t.Run("OAuth redirects to GitHub", func(t *testing.T) {
		w := makeRequest(t, srv, "GET",
			"/api/auth/sign-in/github?callbackURL=http://localhost:3000", "")
		assert.Equal(t, http.StatusFound, w.Code)
		assert.Contains(t, w.Header().Get("Location"), "github.com")
	})

	t.Run("OAuth rejects an unconfigured provider", func(t *testing.T) {
		w := makeRequest(t, srv, "GET",
			"/api/auth/sign-in/twitter?callbackURL=http://localhost:3000", "")
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}
