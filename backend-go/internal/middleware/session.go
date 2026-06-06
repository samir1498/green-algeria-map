package middleware

import (
	"context"
	"net/http"
)

type ctxKey string

const sessionCookieName = "SESSION_ID"
const sessionKey ctxKey = "session_id"

func SetSessionCookie(w http.ResponseWriter, sessionID string) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    sessionID,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	})
}

func ClearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})
}

func GetSessionID(r *http.Request) string {
	if cookie, err := r.Cookie(sessionCookieName); err == nil {
		return cookie.Value
	}
	return ""
}

func WithSession(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sessionID := GetSessionID(r)
		ctx := context.WithValue(r.Context(), sessionKey, sessionID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func FromContext(r *http.Request) string {
	v, _ := r.Context().Value(sessionKey).(string)
	return v
}
