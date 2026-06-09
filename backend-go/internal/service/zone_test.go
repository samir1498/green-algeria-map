package service

import (
	"context"
	"testing"

	"github.com/green-algeria-map/backend-go/internal/model"
	"github.com/green-algeria-map/backend-go/internal/repository"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupZoneSvc(t *testing.T) *ZoneService {
	t.Helper()
	return NewZoneService(repository.NewInMemoryStore())
}

func TestZoneService_CreateAndGet(t *testing.T) {
	svc := setupZoneSvc(t)

	created, err := svc.Create(context.Background(), model.CreateZoneRequest{
		Name: "Zone A", Type: "planting", Status: "planned",
		Lat: 36.75, Lng: 3.05, Description: "test zone",
	})
	require.NoError(t, err)
	assert.Equal(t, "Zone A", created.Name)
	assert.Equal(t, "planting", created.Type)
	assert.Equal(t, 36.75, created.Lat)
	assert.NotEmpty(t, created.ID)

	got, err := svc.Get(context.Background(), created.ID)
	require.NoError(t, err)
	assert.Equal(t, "Zone A", got.Name)
}

func TestZoneService_Get_NotFound(t *testing.T) {
	svc := setupZoneSvc(t)
	_, err := svc.Get(context.Background(), "nonexistent")
	assert.ErrorIs(t, err, ErrZoneNotFound)
}

func TestZoneService_List(t *testing.T) {
	svc := setupZoneSvc(t)

	svc.Create(context.Background(), model.CreateZoneRequest{Name: "A", Type: "planting", Status: "planned", Lat: 1, Lng: 1, Description: ""})
	svc.Create(context.Background(), model.CreateZoneRequest{Name: "B", Type: "trash", Status: "planned", Lat: 2, Lng: 2, Description: ""})

	resp, err := svc.List(context.Background())
	require.NoError(t, err)
	assert.Len(t, resp.Zones, 2)
}

func TestZoneService_Update(t *testing.T) {
	svc := setupZoneSvc(t)

	created, _ := svc.Create(context.Background(), model.CreateZoneRequest{Name: "Old", Type: "planting", Status: "planned", Lat: 1, Lng: 1, Description: "old"})

	updated, err := svc.Update(context.Background(), created.ID, model.UpdateZoneRequest{
		Name: "Updated", Type: "trash", Status: "in-progress", Lat: 2, Lng: 2, Description: "new",
	})
	require.NoError(t, err)
	assert.Equal(t, "Updated", updated.Name)
	assert.Equal(t, "trash", updated.Type)
	assert.Equal(t, 2.0, updated.Lat)
}

func TestZoneService_Update_NotFound(t *testing.T) {
	svc := setupZoneSvc(t)
	_, err := svc.Update(context.Background(), "missing", model.UpdateZoneRequest{
		Name: "X", Type: "planting", Status: "planned", Lat: 0, Lng: 0, Description: "",
	})
	assert.ErrorIs(t, err, ErrZoneNotFound)
}

func TestZoneService_Delete(t *testing.T) {
	svc := setupZoneSvc(t)

	created, _ := svc.Create(context.Background(), model.CreateZoneRequest{Name: "Del", Type: "planting", Status: "planned", Lat: 1, Lng: 1, Description: ""})
	err := svc.Delete(context.Background(), created.ID)
	require.NoError(t, err)

	_, err = svc.Get(context.Background(), created.ID)
	assert.ErrorIs(t, err, ErrZoneNotFound)
}

func TestZoneService_List_Empty(t *testing.T) {
	svc := setupZoneSvc(t)
	resp, err := svc.List(context.Background())
	require.NoError(t, err)
	assert.Empty(t, resp.Zones)
}
