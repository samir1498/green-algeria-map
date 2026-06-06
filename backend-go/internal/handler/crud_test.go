package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/green-algeria-map/backend-go/internal/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func withChiURLParam(r *http.Request, key, value string) *http.Request {
	chiCtx := chi.NewRouteContext()
	chiCtx.URLParams.Add(key, value)
	ctx := context.WithValue(r.Context(), chi.RouteCtxKey, chiCtx)
	return r.WithContext(ctx)
}

func TestCRUD_Create(t *testing.T) {
	h := setupCRUDHandler(t)
	body := `{"name":"test item","description":"a description"}`
	r := httptest.NewRequest("POST", "/api/items", strings.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, r)

	var resp model.ItemResponse
	err := json.NewDecoder(w.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Equal(t, 201, w.Code)
	assert.Equal(t, "test item", resp.Name)
	assert.Equal(t, "a description", resp.Description)
	assert.NotEmpty(t, resp.ID)
}

func TestCRUD_Create_Invalid(t *testing.T) {
	h := setupCRUDHandler(t)
	body := `{"name":"","description":""}`
	r := httptest.NewRequest("POST", "/api/items", strings.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, r)

	assert.Equal(t, 422, w.Code)
}

func TestCRUD_List(t *testing.T) {
	h := setupCRUDHandler(t)

	createBody := `{"name":"item1","description":"desc1"}`
	r := httptest.NewRequest("POST", "/api/items", strings.NewReader(createBody))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, r)
	assert.Equal(t, 201, w.Code)

	r = httptest.NewRequest("GET", "/api/items", nil)
	w = httptest.NewRecorder()
	h.List(w, r)

	var resp model.ListItemsResponse
	err := json.NewDecoder(w.Body).Decode(&resp)
	require.NoError(t, err)
	assert.Equal(t, 200, w.Code)
	assert.Len(t, resp.Items, 1)
	assert.Equal(t, "item1", resp.Items[0].Name)
}

func TestCRUD_GetByID(t *testing.T) {
	h := setupCRUDHandler(t)

	createBody := `{"name":"getme","description":"find me"}`
	r := httptest.NewRequest("POST", "/api/items", strings.NewReader(createBody))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, r)
	assert.Equal(t, 201, w.Code)

	var created model.ItemResponse
	json.NewDecoder(w.Body).Decode(&created)

	r = httptest.NewRequest("GET", "/api/items/"+created.ID, nil)
	r = withChiURLParam(r, "id", created.ID)
	w = httptest.NewRecorder()
	h.GetByID(w, r)

	var resp model.ItemResponse
	json.NewDecoder(w.Body).Decode(&resp)
	assert.Equal(t, 200, w.Code)
	assert.Equal(t, "getme", resp.Name)
}

func TestCRUD_GetByID_NotFound(t *testing.T) {
	h := setupCRUDHandler(t)
	r := httptest.NewRequest("GET", "/api/items/nonexistent", nil)
	w := httptest.NewRecorder()
	h.GetByID(w, r)

	assert.Equal(t, 404, w.Code)
}

func TestCRUD_Update(t *testing.T) {
	h := setupCRUDHandler(t)

	createBody := `{"name":"original","description":"original desc"}`
	r := httptest.NewRequest("POST", "/api/items", strings.NewReader(createBody))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, r)
	assert.Equal(t, 201, w.Code)

	var created model.ItemResponse
	json.NewDecoder(w.Body).Decode(&created)

	updateBody := `{"name":"updated","description":"updated desc"}`
	r = httptest.NewRequest("PUT", "/api/items/"+created.ID, strings.NewReader(updateBody))
	r.Header.Set("Content-Type", "application/json")
	r = withChiURLParam(r, "id", created.ID)
	w = httptest.NewRecorder()
	h.Update(w, r)

	var resp model.ItemResponse
	json.NewDecoder(w.Body).Decode(&resp)
	assert.Equal(t, 200, w.Code)
	assert.Equal(t, "updated", resp.Name)
}

func TestCRUD_Delete(t *testing.T) {
	h := setupCRUDHandler(t)

	createBody := `{"name":"deleteme","description":"bye"}`
	r := httptest.NewRequest("POST", "/api/items", strings.NewReader(createBody))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, r)
	assert.Equal(t, 201, w.Code)

	var created model.ItemResponse
	json.NewDecoder(w.Body).Decode(&created)

	r = httptest.NewRequest("DELETE", "/api/items/"+created.ID, nil)
	r = withChiURLParam(r, "id", created.ID)
	w = httptest.NewRecorder()
	h.Delete(w, r)
	assert.Equal(t, 204, w.Code)

	r = httptest.NewRequest("GET", "/api/items/"+created.ID, nil)
	r = withChiURLParam(r, "id", created.ID)
	w = httptest.NewRecorder()
	h.GetByID(w, r)
	assert.Equal(t, 404, w.Code)
}
