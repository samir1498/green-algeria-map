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

// List godoc
// @Summary List damage reports
// @Description Get all damage reports, optionally filtered by zoneId
// @Tags damage-reports
// @Accept json
// @Produce json
// @Param zoneId query string false "Filter by zone ID"
// @Success 200 {object} model.ListDamageReportsResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /damage-reports [get]
func (h *DamageReportHandler) List(w http.ResponseWriter, r *http.Request) {
	zoneID := r.URL.Query().Get("zoneId")
	var resp *model.ListDamageReportsResponse
	var err error
	if zoneID != "" {
		resp, err = h.svc.ListByZone(r.Context(), zoneID)
	} else {
		resp, err = h.svc.List(r.Context())
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

// Create godoc
// @Summary Create a damage report
// @Description Create a new damage report
// @Tags damage-reports
// @Accept json
// @Produce json
// @Param request body model.CreateDamageReportRequest true "Damage report data"
// @Success 201 {object} model.DamageReportResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 422 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /damage-reports [post]
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

// GetByID godoc
// @Summary Get damage report by ID
// @Description Get a single damage report by its ID
// @Tags damage-reports
// @Accept json
// @Produce json
// @Param id path string true "Damage report ID"
// @Success 200 {object} model.DamageReportResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /damage-reports/{id} [get]
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

// UpdateStatus godoc
// @Summary Update damage report status
// @Description Update the status of a damage report
// @Tags damage-reports
// @Accept json
// @Produce json
// @Param id path string true "Damage report ID"
// @Param request body model.UpdateDamageReportStatusRequest true "Status update"
// @Success 200 {object} model.DamageReportResponse
// @Failure 400 {object} model.ErrorResponse
// @Failure 404 {object} model.ErrorResponse
// @Failure 422 {object} model.ErrorResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /damage-reports/{id}/status [patch]
func (h *DamageReportHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req model.UpdateDamageReportStatusRequest
	if err := decodeBody(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if err := validate.Struct(req); err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	report, err := h.svc.UpdateStatus(r.Context(), id, req.Status)
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

// Delete godoc
// @Summary Delete a damage report
// @Description Delete a damage report by ID
// @Tags damage-reports
// @Accept json
// @Produce json
// @Param id path string true "Damage report ID"
// @Success 204 "No Content"
// @Failure 500 {object} model.ErrorResponse
// @Router /damage-reports/{id} [delete]
func (h *DamageReportHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.svc.Delete(r.Context(), id); err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ListByZone godoc
// @Summary List damage reports by zone
// @Description Get all damage reports for a specific zone
// @Tags damage-reports
// @Accept json
// @Produce json
// @Param zoneId path string true "Zone ID"
// @Success 200 {object} model.ListDamageReportsResponse
// @Failure 500 {object} model.ErrorResponse
// @Router /zones/{zoneId}/damage-reports [get]
func (h *DamageReportHandler) ListByZone(w http.ResponseWriter, r *http.Request) {
	zoneID := chi.URLParam(r, "zoneId")
	resp, err := h.svc.ListByZone(r.Context(), zoneID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, resp)
}
