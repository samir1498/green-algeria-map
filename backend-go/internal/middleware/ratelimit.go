package middleware

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

type visitor struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

var (
	visitorsMu sync.RWMutex
	visitors   = make(map[string]*visitor)
	cleanup    sync.Once
)

const defaultCapacity = 20

type limitConfig struct {
	rps   float64
	burst int
}

var defaultLimits = map[string]limitConfig{
	"auth":  {rps: 5.0 / 60.0, burst: 5},
	"write": {rps: 30.0 / 60.0, burst: 30},
	"read":  {rps: 100.0 / 60.0, burst: 100},
}

func getLimiter(key string, cfg limitConfig) *rate.Limiter {
	visitorsMu.Lock()
	defer visitorsMu.Unlock()
	v, ok := visitors[key]
	if !ok {
		l := rate.NewLimiter(rate.Limit(cfg.rps), cfg.burst)
		visitors[key] = &visitor{limiter: l, lastSeen: time.Now()}
		return l
	}
	v.lastSeen = time.Now()
	return v.limiter
}

func cleanupVisitors() {
	ticker := time.NewTicker(5 * time.Minute)
	for range ticker.C {
		visitorsMu.Lock()
		now := time.Now()
		for ip, v := range visitors {
			if now.Sub(v.lastSeen) > 10*time.Minute {
				delete(visitors, ip)
			}
		}
		visitorsMu.Unlock()
	}
}

func RateLimit(next http.Handler) http.Handler {
	if os.Getenv("DISABLE_RATE_LIMIT") == "true" {
		return next
	}

	cleanup.Do(func() {
		go cleanupVisitors()
	})

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		if idx := strings.LastIndex(ip, ":"); idx != -1 {
			ip = ip[:idx]
		}
		path := r.URL.Path
		method := r.Method
		key := ip + ":" + path

		var cfg limitConfig
		if strings.Contains(path, "/api/auth/sign-in") || strings.Contains(path, "/api/auth/sign-up") {
			cfg = defaultLimits["auth"]
		} else if method == "POST" || method == "PATCH" || method == "DELETE" {
			cfg = defaultLimits["write"]
		} else if method == "GET" {
			cfg = defaultLimits["read"]
		} else {
			next.ServeHTTP(w, r)
			return
		}

		limiter := getLimiter(key, cfg)
		if !limiter.Allow() {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			json.NewEncoder(w).Encode(map[string]string{"error": "Too Many Requests"})
			return
		}
		next.ServeHTTP(w, r)
	})
}
