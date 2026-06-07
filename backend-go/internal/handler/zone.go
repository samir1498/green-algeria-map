package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/green-algeria-map/backend-go/internal/model"
	"github.com/green-algeria-map/backend-go/internal/service"
)

type ZoneHandler struct {
	svc *service.ZoneService
}

func NewZoneHandler(svc *service.ZoneService) *ZoneHandler {
	return &ZoneHandler{svc: svc}
}

func (h *ZoneHandler) List(w http.ResponseWriter, r *http.Request) {
	resp, err := h.svc.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *ZoneHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req model.CreateZoneRequest
	if err := decodeBody(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if err := validate.Struct(req); err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	zone, err := h.svc.Create(r.Context(), req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusCreated, zone)
}

func (h *ZoneHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	zone, err := h.svc.Get(r.Context(), id)
	if err != nil {
		if err == service.ErrZoneNotFound {
			writeError(w, http.StatusNotFound, "zone not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, zone)
}

func (h *ZoneHandler) Update(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req model.UpdateZoneRequest
	if err := decodeBody(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if err := validate.Struct(req); err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	zone, err := h.svc.Update(r.Context(), id, req)
	if err != nil {
		if err == service.ErrZoneNotFound {
			writeError(w, http.StatusNotFound, "zone not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, zone)
}

func (h *ZoneHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.svc.Delete(r.Context(), id); err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
