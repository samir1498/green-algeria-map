package auth

import (
	"database/sql"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/jeromesth/go-better-auth"
	"github.com/jeromesth/go-better-auth/adapter/sqlx"
	"github.com/jmoiron/sqlx"
)

func New(databaseURL string) *betterauth.Auth {
	conn, err := sql.Open("pgx", databaseURL)
	if err != nil {
		panic("auth: failed to open database: " + err.Error())
	}
	db := sqlx.NewDb(conn, "postgres")

	adapter := sqlxadapter.New(db)

	secret := os.Getenv("AUTH_SECRET")
	if secret == "" {
		secret = "change-me-generate-a-real-secret"
	}

	rateLimitEnabled := os.Getenv("DISABLE_RATE_LIMIT") != "true"

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