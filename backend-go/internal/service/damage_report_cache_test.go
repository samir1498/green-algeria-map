package service

import (
	"context"
	"testing"

	"github.com/green-algeria-map/backend-go/internal/model"
	"github.com/green-algeria-map/backend-go/internal/repository"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type mockDamageReportRepo struct {
	mock.Mock
}

func (m *mockDamageReportRepo) GetDamageReport(ctx context.Context, id string) (*repository.DamageReportEntity, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*repository.DamageReportEntity), args.Error(1)
}

func (m *mockDamageReportRepo) ListDamageReports(ctx context.Context) ([]*repository.DamageReportEntity, error) {
	args := m.Called(ctx)
	return args.Get(0).([]*repository.DamageReportEntity), args.Error(1)
}

func (m *mockDamageReportRepo) CreateDamageReport(ctx context.Context, zoneID *string, title, description, severity string, lat, lng float64) (*repository.DamageReportEntity, error) {
	args := m.Called(ctx, zoneID, title, description, severity, lat, lng)
	return args.Get(0).(*repository.DamageReportEntity), args.Error(1)
}

func makeDR(id, title string) *repository.DamageReportEntity {
	t := tNow()
	zoneID := "zone-1"
	return &repository.DamageReportEntity{
		ID:          id,
		ZoneID:      &zoneID,
		Title:       title,
		Description: "desc",
		Severity:    "high",
		Lat:         36.0,
		Lng:         3.0,
		CreatedAt:   t,
		UpdatedAt:   t,
	}
}

func TestDamageReportCache_Get(t *testing.T) {
	mockRepo := new(mockDamageReportRepo)
	svc := NewDamageReportService(mockRepo)

	dr := makeDR("dr-1", "Erosion")
	mockRepo.On("GetDamageReport", mock.Anything, "dr-1").Return(dr, nil).Once()

	resp1, err := svc.Get(context.Background(), "dr-1")
	assert.NoError(t, err)
	assert.Equal(t, "Erosion", resp1.Title)

	resp2, err := svc.Get(context.Background(), "dr-1")
	assert.NoError(t, err)
	assert.Equal(t, "Erosion", resp2.Title)

	mockRepo.AssertExpectations(t)
}

func TestDamageReportCache_List(t *testing.T) {
	mockRepo := new(mockDamageReportRepo)
	svc := NewDamageReportService(mockRepo)

	reports := []*repository.DamageReportEntity{makeDR("dr-1", "Erosion")}
	mockRepo.On("ListDamageReports", mock.Anything).Return(reports, nil).Once()

	resp1, err := svc.List(context.Background())
	assert.NoError(t, err)
	assert.Len(t, resp1.Reports, 1)

	resp2, err := svc.List(context.Background())
	assert.NoError(t, err)
	assert.Len(t, resp2.Reports, 1)

	mockRepo.AssertExpectations(t)
}

func TestDamageReportCache_EvictOnCreate(t *testing.T) {
	mockRepo := new(mockDamageReportRepo)
	svc := NewDamageReportService(mockRepo)

	reports := []*repository.DamageReportEntity{makeDR("dr-1", "Erosion")}
	mockRepo.On("ListDamageReports", mock.Anything).Return(reports, nil).Once()
	_, _ = svc.List(context.Background())

	zoneID := "zone-1"
	newDR := makeDR("dr-2", "Deforestation")
	mockRepo.On("CreateDamageReport", mock.Anything, &zoneID, "Deforestation", "desc", "high", 36.0, 3.0).Return(newDR, nil)
	mockRepo.On("ListDamageReports", mock.Anything).Return(append(reports, newDR), nil).Once()

	_, _ = svc.Create(context.Background(), model.CreateDamageReportRequest{
		ZoneID: "zone-1", Title: "Deforestation",
		Description: "desc", Severity: "high",
		Lat: 36.0, Lng: 3.0,
	})
	resp, err := svc.List(context.Background())
	assert.NoError(t, err)
	assert.Len(t, resp.Reports, 2)

	mockRepo.AssertExpectations(t)
}
