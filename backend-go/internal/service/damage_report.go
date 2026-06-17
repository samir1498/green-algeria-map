package service

import (
	"context"
	"errors"
	"fmt"

	lru "github.com/hashicorp/golang-lru/v2"
	"github.com/green-algeria-map/backend-go/internal/model"
	"github.com/green-algeria-map/backend-go/internal/repository"
)

type DamageReportRepository interface {
	CreateDamageReport(ctx context.Context, zoneID *string, title, description, severity string, lat, lng float64) (*repository.DamageReportEntity, error)
	GetDamageReport(ctx context.Context, id string) (*repository.DamageReportEntity, error)
	ListDamageReports(ctx context.Context) ([]*repository.DamageReportEntity, error)
}

type DamageReportService struct {
	repo  DamageReportRepository
	cache *lru.Cache[string, any]
}

var ErrDamageReportNotFound = errors.New("damage report not found")

func NewDamageReportService(repo DamageReportRepository) *DamageReportService {
	c, _ := lru.New[string, any](500)
	return &DamageReportService{repo: repo, cache: c}
}

func (s *DamageReportService) Create(ctx context.Context, req model.CreateDamageReportRequest) (*model.DamageReportResponse, error) {
	dr, err := s.repo.CreateDamageReport(ctx, &req.ZoneID, req.Title, req.Description, req.Severity, req.Lat, req.Lng)
	if err != nil {
		return nil, err
	}
	s.cache.Remove("damage-reports:all")
	return toDamageReportResponse(dr), nil
}

func (s *DamageReportService) Get(ctx context.Context, id string) (*model.DamageReportResponse, error) {
	key := fmt.Sprintf("damage-report:%s", id)
	if v, ok := s.cache.Get(key); ok {
		return v.(*model.DamageReportResponse), nil
	}
	dr, err := s.repo.GetDamageReport(ctx, id)
	if err != nil {
		return nil, err
	}
	if dr == nil {
		return nil, ErrDamageReportNotFound
	}
	resp := toDamageReportResponse(dr)
	s.cache.Add(key, resp)
	return resp, nil
}

func (s *DamageReportService) List(ctx context.Context) (*model.ListDamageReportsResponse, error) {
	if v, ok := s.cache.Get("damage-reports:all"); ok {
		return v.(*model.ListDamageReportsResponse), nil
	}
	reports, err := s.repo.ListDamageReports(ctx)
	if err != nil {
		return nil, err
	}
	resp := &model.ListDamageReportsResponse{Reports: make([]model.DamageReportResponse, 0, len(reports))}
	for _, dr := range reports {
		resp.Reports = append(resp.Reports, *toDamageReportResponse(dr))
	}
	s.cache.Add("damage-reports:all", resp)
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
