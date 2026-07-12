package auth

import (
	"net/http"
	"os"

	"github.com/green-algeria-map/backend-go/internal/auth/pgadapter"
	"github.com/green-algeria-map/backend-go/internal/email"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jeromesth/go-better-auth"
)

func New(pool *pgxpool.Pool) *betterauth.Auth {
	adapter := pgadapter.New(pool)

	secret := os.Getenv("AUTH_SECRET")
	if secret == "" {
		secret = "change-me-generate-a-real-secret"
	}

	rateLimitEnabled := os.Getenv("DISABLE_RATE_LIMIT") != "true"

	mail := email.NewClient()

	return betterauth.New(betterauth.BetterAuthOptions{
		BaseURL:  os.Getenv("BETTER_AUTH_URL"),
		BasePath: "/api/auth",
		Secret:   secret,
		Database: &betterauth.DatabaseConfig{Adapter: adapter},
		EmailAndPassword: &betterauth.EmailPassConfig{
			Enabled:           true,
			MinPasswordLength: 8,
			MaxPasswordLength: 128,
			AutoSignIn:        true,
			SendResetPassword: func(data betterauth.ResetPasswordData, r *http.Request) error {
				html := email.PasswordResetEmail(data.User.Name, data.URL)
				return mail.Send(data.User.Email, "Reset your password — Green Algeria Map", html)
			},
			RequireEmailVerification: false,
		},
		EmailVerification: &betterauth.EmailVerifConfig{
			SendOnSignUp:                true,
			AutoSignInAfterVerification: true,
			SendVerificationEmail: func(data betterauth.EmailVerificationData, r *http.Request) error {
				html := email.VerificationEmail(data.User.Name, data.URL)
				return mail.Send(data.User.Email, "Verify your email — Green Algeria Map", html)
			},
		},
		TrustedOrigins: []string{"http://localhost:3000", "http://localhost:4173"},
		User: &betterauth.UserConfig{
			AdditionalFields: map[string]betterauth.FieldAttribute{
				"role": {Type: "string", Required: true, Unique: false},
			},
		},
		RateLimit: &betterauth.RateLimitConfig{
			Enabled: rateLimitEnabled,
			Window:  60,
			Max:     100,
			CustomRules: []betterauth.RateLimitRule{
				{PathMatcher: "/sign-in/email", Window: 60, Max: 5},
				{PathMatcher: "/sign-up/email", Window: 60, Max: 5},
			},
		},
	})
}
