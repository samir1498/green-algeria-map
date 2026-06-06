package handler

import (
	"net/http"

	"github.com/green-algeria-map/backend-go/internal/model"
)

func Echo(w http.ResponseWriter, r *http.Request) {
	var req model.EchoRequest
	if err := decodeBody(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if err := validate.Struct(req); err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, model.EchoResponse{Echo: req})
}

func Validate(w http.ResponseWriter, r *http.Request) {
	var req model.ValidateRequest
	if err := decodeBody(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if err := validate.Struct(req); err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, model.ValidateResponse{Valid: true})
}
