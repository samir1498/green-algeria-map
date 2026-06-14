package handler

import (
	"encoding/json"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/green-algeria-map/backend-go/internal/model"
	"github.com/green-algeria-map/backend-go/internal/repository"
	"github.com/green-algeria-map/backend-go/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupZoneHandler(t *testing.T) *ZoneHandler {
	t.Helper()
	store := repository.NewInMemoryStore()
	svc := service.NewZoneService(store)
	return NewZoneHandler(svc)
}

func TestZoneHandler_CreateAndList(t *testing.T) {
	h := setupZoneHandler(t)

	body := `{"name":"Park","type":"planting","status":"planned","lat":36.75,"lng":3.05,"description":"test"}`
	r := httptest.NewRequest("POST", "/api/zones", strings.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, r)

	assert.Equal(t, 201, w.Code)
	var created model.ZoneResponse
	json.NewDecoder(w.Body).Decode(&created)
	assert.Equal(t, "Park", created.Name)
	assert.NotEmpty(t, created.ID)
	assert.Empty(t, created.Photos)

	r = httptest.NewRequest("GET", "/api/zones", nil)
	w = httptest.NewRecorder()
	h.List(w, r)

	var listed model.ListZonesResponse
	json.NewDecoder(w.Body).Decode(&listed)
	assert.Equal(t, 200, w.Code)
	assert.Len(t, listed.Zones, 1)
	assert.Equal(t, "Park", listed.Zones[0].Name)
}

func TestZoneHandler_Create_Invalid(t *testing.T) {
	h := setupZoneHandler(t)

	for name, tc := range map[string]struct {
		body string
		code int
	}{
		"empty body":    {`{}`, 422},
		"missing name":  {`{"type":"planting","status":"planned","lat":1,"lng":1,"description":""}`, 422},
		"bad JSON":      {`not json`, 400},
	} {
		t.Run(name, func(t *testing.T) {
			r := httptest.NewRequest("POST", "/api/zones", strings.NewReader(tc.body))
			r.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			h.Create(w, r)
			assert.Equal(t, tc.code, w.Code)
		})
	}
}

func TestZoneHandler_GetByID(t *testing.T) {
	h := setupZoneHandler(t)

	// not found
	r := httptest.NewRequest("GET", "/api/zones/missing", nil)
	w := httptest.NewRecorder()
	h.GetByID(w, r)
	assert.Equal(t, 404, w.Code)

	// create then get
	body := `{"name":"Z","type":"planting","status":"planned","lat":1,"lng":1,"description":""}`
	r = httptest.NewRequest("POST", "/api/zones", strings.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	w = httptest.NewRecorder()
	h.Create(w, r)
	require.Equal(t, 201, w.Code)

	var created model.ZoneResponse
	json.NewDecoder(w.Body).Decode(&created)

	r2 := httptest.NewRequest("GET", "/api/zones/"+created.ID, nil)
	r2 = withChiURLParam(r2, "id", created.ID)
	w2 := httptest.NewRecorder()
	h.GetByID(w2, r2)

	var got model.ZoneResponse
	json.NewDecoder(w2.Body).Decode(&got)
	assert.Equal(t, 200, w2.Code)
	assert.Equal(t, "Z", got.Name)
}

func TestZoneHandler_Update(t *testing.T) {
	h := setupZoneHandler(t)

	body := `{"name":"Old","type":"planting","status":"planned","lat":1,"lng":1,"description":"old"}`
	r := httptest.NewRequest("POST", "/api/zones", strings.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, r)

	var created model.ZoneResponse
	json.NewDecoder(w.Body).Decode(&created)

	updateBody := `{"name":"Updated","type":"trash","status":"in-progress","lat":2,"lng":2,"description":"new"}`
	r2 := httptest.NewRequest("PUT", "/api/zones/"+created.ID, strings.NewReader(updateBody))
	r2.Header.Set("Content-Type", "application/json")
	r2 = withChiURLParam(r2, "id", created.ID)
	w2 := httptest.NewRecorder()
	h.Update(w2, r2)

	var updated model.ZoneResponse
	json.NewDecoder(w2.Body).Decode(&updated)
	assert.Equal(t, 200, w2.Code)
	assert.Equal(t, "Updated", updated.Name)
}

func TestZoneHandler_Delete(t *testing.T) {
	h := setupZoneHandler(t)

	body := `{"name":"Del","type":"planting","status":"planned","lat":1,"lng":1,"description":""}`
	r := httptest.NewRequest("POST", "/api/zones", strings.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	h.Create(w, r)

	var created model.ZoneResponse
	json.NewDecoder(w.Body).Decode(&created)

	r2 := httptest.NewRequest("DELETE", "/api/zones/"+created.ID, nil)
	r2 = withChiURLParam(r2, "id", created.ID)
	w2 := httptest.NewRecorder()
	h.Delete(w2, r2)
	assert.Equal(t, 204, w2.Code)

	r3 := httptest.NewRequest("GET", "/api/zones/"+created.ID, nil)
	r3 = withChiURLParam(r3, "id", created.ID)
	w3 := httptest.NewRecorder()
	h.GetByID(w3, r3)
	assert.Equal(t, 404, w3.Code)
}
