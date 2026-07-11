package middleware

import (
	"encoding/json"
	"net/http"

	betterauth "github.com/jeromesth/go-better-auth"
	"github.com/jeromesth/go-better-auth/session"
)

var authInstance *betterauth.Auth

func SetAuth(a *betterauth.Auth) {
	authInstance = a
}

func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if authInstance == nil {
			next.ServeHTTP(w, r)
			return
		}

		token := session.GetSessionToken(r)
		if token == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Authentication required"})
			return
		}

		sm := authInstance.SessionManager()
		sess, err := sm.FindByToken(r.Context(), token)
		if err != nil || sess == nil || session.IsExpired(sess) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid or expired session"})
			return
		}

		next.ServeHTTP(w, r)
	})
}
