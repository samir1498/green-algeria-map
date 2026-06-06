package middleware

import (
	"net/http"
	"os"
	"strings"
)

var allowedOrigins = func() []string {
	env := os.Getenv("CORS_ALLOWED_ORIGINS")
	if env != "" {
		return strings.Split(env, ",")
	}
	return []string{
		"http://localhost:4173",
		"http://localhost:5173",
	}
}()

func originAllowed(origin string) bool {
	for _, a := range allowedOrigins {
		if a == origin {
			return true
		}
	}
	return false
}

func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		if origin != "" && originAllowed(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
			w.Header().Set("Access-Control-Max-Age", "86400")
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
