package service

import (
	"context"
	"testing"
	"time"

	"github.com/green-algeria-map/backend-go/internal/model"
	"github.com/green-algeria-map/backend-go/internal/repository"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockZoneRepo struct {
	mock.Mock
}

func (m *mockZoneRepo) GetZone(ctx context.Context, id string) (*repository.ZoneEntity, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.ZoneEntity), args.Error(1)
}

func (m *mockZoneRepo) ListZones(ctx context.Context) ([]*repository.ZoneEntity, error) {
	args := m.Called(ctx)
	return args.Get(0).([]*repository.ZoneEntity), args.Error(1)
}

func (m *mockZoneRepo) CreateZone(ctx context.Context, name, zoneType, status string, lat, lng float64, targetCount, currentCount *int, description, treeSpecies, organizerContact string, volunteerCount int, photos []string) (*repository.ZoneEntity, error) {
	args := m.Called(ctx, name, zoneType, status, lat, lng, targetCount, currentCount, description, treeSpecies, organizerContact, volunteerCount, photos)
	return args.Get(0).(*repository.ZoneEntity), args.Error(1)
}

func (m *mockZoneRepo) UpdateZone(ctx context.Context, id, name, zoneType, status string, lat, lng float64, targetCount, currentCount *int, description, treeSpecies, organizerContact string, volunteerCount int, photos []string) (*repository.ZoneEntity, error) {
	args := m.Called(ctx, id, name, zoneType, status, lat, lng, targetCount, currentCount, description, treeSpecies, organizerContact, volunteerCount, photos)
	return args.Get(0).(*repository.ZoneEntity), args.Error(1)
}

func (m *mockZoneRepo) UpdateZoneVolunteer(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *mockZoneRepo) AddZonePhoto(ctx context.Context, id, photoURL string) error {
	args := m.Called(ctx, id, photoURL)
	return args.Error(0)
}

func (m *mockZoneRepo) DeleteZone(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func tNow() time.Time {
	return time.Date(2026, 6, 17, 0, 0, 0, 0, time.UTC)
}

func makeZone(id, name string) *repository.ZoneEntity {
	t := tNow()
	return &repository.ZoneEntity{
		ID:               id,
		Name:             name,
		Type:             "forest",
		Status:           "active",
		Lat:              36.0,
		Lng:              3.0,
		Description:      "test",
		TreeSpecies:      "oak",
		OrganizerContact: "test@test.com",
		VolunteerCount:   0,
		Photos:           []string{},
		CreatedAt:        t,
		UpdatedAt:        t,
	}
}

func TestZoneCache_Get(t *testing.T) {
	mockRepo := new(mockZoneRepo)
	svc := NewZoneService(mockRepo)

	zone := makeZone("zone-1", "Test Zone")
	mockRepo.On("GetZone", mock.Anything, "zone-1").Return(zone, nil)

	resp1, err := svc.Get(context.Background(), "zone-1")
	assert.NoError(t, err)
	assert.Equal(t, "Test Zone", resp1.Name)

	resp2, err := svc.Get(context.Background(), "zone-1")
	assert.NoError(t, err)
	assert.Equal(t, "Test Zone", resp2.Name)

	mockRepo.AssertExpectations(t)
}

func TestZoneCache_List(t *testing.T) {
	mockRepo := new(mockZoneRepo)
	svc := NewZoneService(mockRepo)

	zones := []*repository.ZoneEntity{makeZone("zone-1", "Zone A")}
	mockRepo.On("ListZones", mock.Anything).Return(zones, nil).Once()

	resp1, err := svc.List(context.Background())
	assert.NoError(t, err)
	assert.Len(t, resp1.Zones, 1)

	resp2, err := svc.List(context.Background())
	assert.NoError(t, err)
	assert.Len(t, resp2.Zones, 1)

	mockRepo.AssertExpectations(t)
}

func TestZoneCache_EvictOnCreate(t *testing.T) {
	mockRepo := new(mockZoneRepo)
	svc := NewZoneService(mockRepo)

	zones := []*repository.ZoneEntity{makeZone("zone-1", "Zone A")}
	mockRepo.On("ListZones", mock.Anything).Return(zones, nil).Once()
	_, _ = svc.List(context.Background())

	newZone := makeZone("zone-2", "Zone B")
	mockRepo.On("CreateZone", mock.Anything, "Zone B", "forest", "active", 36.0, 3.0, (*int)(nil), (*int)(nil), "desc", "oak", "test@test.com", 0, []string(nil)).Return(newZone, nil)
	mockRepo.On("ListZones", mock.Anything).Return(append(zones, newZone), nil).Once()

	_, _ = svc.Create(context.Background(), model.CreateZoneRequest{
		Name: "Zone B", Type: "forest", Status: "active",
		Lat: 36.0, Lng: 3.0, Description: "desc",
		TreeSpecies: "oak", OrganizerContact: "test@test.com",
	})
	resp, err := svc.List(context.Background())
	assert.NoError(t, err)
	assert.Len(t, resp.Zones, 2)

	mockRepo.AssertExpectations(t)
}

func TestZoneCache_EvictGetOnUpdate(t *testing.T) {
	mockRepo := new(mockZoneRepo)
	svc := NewZoneService(mockRepo)

	before := makeZone("zone-1", "Before")
	after := makeZone("zone-1", "After")

	mockRepo.On("GetZone", mock.Anything, "zone-1").Return(before, nil).Once()
	resp1, err := svc.Get(context.Background(), "zone-1")
	assert.NoError(t, err)
	assert.Equal(t, "Before", resp1.Name)

	mockRepo.On("UpdateZone", mock.Anything, "zone-1", "After", "forest", "active", 36.0, 3.0, (*int)(nil), (*int)(nil), "desc", "oak", "test@test.com", 0, []string(nil)).Return(after, nil)
	_, err = svc.Update(context.Background(), "zone-1", model.UpdateZoneRequest{
		Name: "After", Type: "forest", Status: "active",
		Lat: 36.0, Lng: 3.0, Description: "desc",
		TreeSpecies: "oak", OrganizerContact: "test@test.com",
	})
	assert.NoError(t, err)

	mockRepo.On("GetZone", mock.Anything, "zone-1").Return(after, nil).Once()
	resp2, err := svc.Get(context.Background(), "zone-1")
	assert.NoError(t, err)
	assert.Equal(t, "After", resp2.Name)

	mockRepo.AssertExpectations(t)
}
