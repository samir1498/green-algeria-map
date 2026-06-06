package service

import (
	"context"
	"errors"

	"github.com/green-algeria-map/backend-go/internal/model"
	"github.com/green-algeria-map/backend-go/internal/repository"
)

type DamageReportRepository interface {
	CreateDamageReport(ctx context.Context, zoneID *string, title, description, severity string, lat, lng float64) (*repository.DamageReportEntity, error)
	GetDamageReport(ctx context.Context, id string) (*repository.DamageReportEntity, error)
	ListDamageReports(ctx context.Context) ([]*repository.DamageReportEntity, error)
}

type DamageReportService struct {
	repo DamageReportRepository
}

var ErrDamageReportNotFound = errors.New("damage report not found")

func NewDamageReportService(repo DamageReportRepository) *DamageReportService {
	return &DamageReportService{repo: repo}
}

func (s *DamageReportService) Create(ctx context.Context, req model.CreateDamageReportRequest) (*model.DamageReportResponse, error) {
	dr, err := s.repo.CreateDamageReport(ctx, &req.ZoneID, req.Title, req.Description, req.Severity, req.Lat, req.Lng)
	if err != nil {
		return nil, err
	}
	return toDamageReportResponse(dr), nil
}

func (s *DamageReportService) Get(ctx context.Context, id string) (*model.DamageReportResponse, error) {
	dr, err := s.repo.GetDamageReport(ctx, id)
	if err != nil {
		return nil, err
	}
	if dr == nil {
		return nil, ErrDamageReportNotFound
	}
	return toDamageReportResponse(dr), nil
}

func (s *DamageReportService) List(ctx context.Context) (*model.ListDamageReportsResponse, error) {
	reports, err := s.repo.ListDamageReports(ctx)
	if err != nil {
		return nil, err
	}
	resp := &model.ListDamageReportsResponse{Reports: make([]model.DamageReportResponse, 0, len(reports))}
	for _, dr := range reports {
		resp.Reports = append(resp.Reports, *toDamageReportResponse(dr))
	}
	return resp, nil
}

func toDamageReportResponse(dr *repository.DamageReportEntity) *model.DamageReportResponse {
	return &model.DamageReportResponse{
		ID:          dr.ID,
		ZoneID:      dr.ZoneID,
		Title:       dr.Title,
		Description: dr.Description,
		Severity:    dr.Severity,
		Lat:         dr.Lat,
		Lng:         dr.Lng,
		CreatedAt:   dr.CreatedAt,
		UpdatedAt:   dr.UpdatedAt,
	}
}
