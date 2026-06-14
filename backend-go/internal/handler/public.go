package handler

import (
	"net/http"

	"github.com/green-algeria-map/backend-go/internal/service"
)

type PublicHandler struct {
	zoneSvc   *service.ZoneService
	damageSvc *service.DamageReportService
}

func NewPublicHandler(zoneSvc *service.ZoneService, damageSvc *service.DamageReportService) *PublicHandler {
	return &PublicHandler{zoneSvc: zoneSvc, damageSvc: damageSvc}
}

func (h *PublicHandler) MapData(w http.ResponseWriter, r *http.Request) {
	zones, err := h.zoneSvc.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	damageReports, err := h.damageSvc.List(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"zones":          zones.Zones,
		"damageReports":  damageReports.Reports,
	})
}
