package middleware

import (
	"context"
	"encoding/json"
	"net/http"

	betterauth "github.com/jeromesth/go-better-auth"
	"github.com/jeromesth/go-better-auth/models"
	"github.com/jeromesth/go-better-auth/session"
)

type ctxKey string

const (
	ctxSession ctxKey = "auth_session"
	ctxUser    ctxKey = "auth_user"
)

var authInstance *betterauth.Auth

func SetAuth(a *betterauth.Auth) {
	authInstance = a
}

func GetSession(r *http.Request) *models.Session {
	v, _ := r.Context().Value(ctxSession).(*models.Session)
	return v
}

func GetUser(r *http.Request) *models.User {
	v, _ := r.Context().Value(ctxUser).(*models.User)
	return v
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

		user, err := authInstance.InternalAdapter().FindUserByID(r.Context(), sess.UserID)
		if err != nil || user == nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "User not found"})
			return
		}

		ctx := context.WithValue(r.Context(), ctxSession, sess)
		ctx = context.WithValue(ctx, ctxUser, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
