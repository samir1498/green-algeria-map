package handler

import (
	"net/http"

	"github.com/green-algeria-map/backend-go/internal/model"
)

func Live(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, model.PingResponse{Status: "ok"})
}

func Ready(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"status":  "ok",
		"storage": map[string]string{"status": "ok"},
	})
}

func Ping(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, model.PingResponse{Status: "ok"})
}
