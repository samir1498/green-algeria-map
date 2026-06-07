package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/green-algeria-map/backend-go/internal/model"
	"github.com/green-algeria-map/backend-go/internal/service"
)

type DamageReportHandler struct {
	svc *service.DamageReportService
}

func NewDamageReportHandler(svc *service.DamageReportService) *DamageReportHandler {
	return &DamageReportHandler{svc: svc}
}

func (h *DamageReportHandler) List(w http.ResponseWriter, r *http.Request) {
	resp, err := h.svc.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *DamageReportHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req model.CreateDamageReportRequest
	if err := decodeBody(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if err := validate.Struct(req); err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	report, err := h.svc.Create(r.Context(), req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusCreated, report)
}

func (h *DamageReportHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	report, err := h.svc.Get(r.Context(), id)
	if err != nil {
		if err == service.ErrDamageReportNotFound {
			writeError(w, http.StatusNotFound, "damage report not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, report)
}
