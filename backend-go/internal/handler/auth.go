package handler

import (
	"net/http"

	"github.com/green-algeria-map/backend-go/internal/middleware"
	"github.com/green-algeria-map/backend-go/internal/model"
	"github.com/green-algeria-map/backend-go/internal/service"
)

type AuthHandler struct {
	svc *service.AuthService
}

func NewAuthHandler(svc *service.AuthService) *AuthHandler {
	return &AuthHandler{svc: svc}
}

func (h *AuthHandler) SignUp(w http.ResponseWriter, r *http.Request) {
	var req model.SignUpRequest
	if err := decodeBody(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if err := validate.Struct(req); err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	resp, sess, err := h.svc.SignUpWithSession(r.Context(), req)
	if err != nil {
		if err == service.ErrEmailTaken {
			writeError(w, http.StatusConflict, "email already registered")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	middleware.SetSessionCookie(w, sess.ID)
	writeJSON(w, http.StatusCreated, resp)
}

func (h *AuthHandler) SignIn(w http.ResponseWriter, r *http.Request) {
	var req model.LoginRequest
	if err := decodeBody(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if err := validate.Struct(req); err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	resp, sess, err := h.svc.SignIn(r.Context(), req)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "invalid email or password")
		return
	}
	middleware.SetSessionCookie(w, sess.ID)
	writeJSON(w, http.StatusOK, resp)
}

func (h *AuthHandler) GetSession(w http.ResponseWriter, r *http.Request) {
	sessionID := middleware.GetSessionID(r)
	resp, err := h.svc.GetSession(r.Context(), sessionID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *AuthHandler) SignOut(w http.ResponseWriter, r *http.Request) {
	sessionID := middleware.GetSessionID(r)
	if sessionID != "" {
		h.svc.SignOut(r.Context(), sessionID)
	}
	middleware.ClearSessionCookie(w)
	writeJSON(w, http.StatusOK, model.SignOutResponse{Success: true})
}
