package middleware

import (
	"context"
	"encoding/json"
	"log"
	"net/http"

	"github.com/green-algeria-map/backend-go/internal/model"
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
			writeError(w, http.StatusUnauthorized, "Authentication required")
			return
		}

		sm := authInstance.SessionManager()
		sess, err := sm.FindByToken(r.Context(), token)
		if err != nil {
			log.Printf("auth: FindByToken error: %v", err)
			writeError(w, http.StatusInternalServerError, "Internal server error")
			return
		}
		if sess == nil || session.IsExpired(sess) {
			writeError(w, http.StatusUnauthorized, "Invalid or expired session")
			return
		}

		sess, err = sm.RefreshIfNeeded(r.Context(), sess)
		if err != nil {
			log.Printf("auth: RefreshIfNeeded error: %v", err)
		}

		var user *models.User
		user, err = authInstance.InternalAdapter().FindUserByID(r.Context(), sess.UserID)
		if err != nil {
			log.Printf("auth: FindUserByID error: %v", err)
			writeError(w, http.StatusInternalServerError, "Internal server error")
			return
		}
		if user == nil {
			writeError(w, http.StatusUnauthorized, "User not found")
			return
		}

		ctx := context.WithValue(r.Context(), ctxSession, sess)
		ctx = context.WithValue(ctx, ctxUser, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func writeError(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(model.ErrorResponse{Error: msg})
}
