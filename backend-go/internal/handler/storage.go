package handler

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/green-algeria-map/backend-go/internal/service"
)

const maxUploadSize = 5 << 20 // 5MB

type StorageHandler struct {
	zoneSvc *service.ZoneService
}

func NewStorageHandler(zoneSvc *service.ZoneService) *StorageHandler {
	return &StorageHandler{zoneSvc: zoneSvc}
}

func (h *StorageHandler) UploadZonePhoto(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		writeError(w, http.StatusBadRequest, "file too large or invalid multipart")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "no file uploaded")
		return
	}
	defer file.Close()

	ext := filepath.Ext(header.Filename)
	filename := uuid.New().String() + ext
	dir := filepath.Join("uploads")
	if err := os.MkdirAll(dir, 0755); err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	dst, err := os.Create(filepath.Join(dir, filename))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	zoneID := chi.URLParam(r, "id")
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	photoUrl := fmt.Sprintf("http://localhost:%s/uploads/%s", port, filename)

	if _, err := h.zoneSvc.AddPhoto(r.Context(), zoneID, photoUrl); err != nil {
		if err == service.ErrZoneNotFound {
			writeError(w, http.StatusNotFound, "zone not found")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"photoUrl": photoUrl})
}
