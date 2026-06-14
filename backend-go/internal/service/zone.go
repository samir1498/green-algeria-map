package service

import (
	"context"
	"errors"

	"github.com/green-algeria-map/backend-go/internal/model"
	"github.com/green-algeria-map/backend-go/internal/repository"
)

type ZoneRepository interface {
	CreateZone(ctx context.Context, name, zoneType, status string, lat, lng float64, description string, photos []string) (*repository.ZoneEntity, error)
	GetZone(ctx context.Context, id string) (*repository.ZoneEntity, error)
	ListZones(ctx context.Context) ([]*repository.ZoneEntity, error)
	UpdateZone(ctx context.Context, id, name, zoneType, status string, lat, lng float64, description string, photos []string) (*repository.ZoneEntity, error)
	DeleteZone(ctx context.Context, id string) error
}

type ZoneService struct {
	repo ZoneRepository
}

var ErrZoneNotFound = errors.New("zone not found")

func NewZoneService(repo ZoneRepository) *ZoneService {
	return &ZoneService{repo: repo}
}

func (s *ZoneService) Create(ctx context.Context, req model.CreateZoneRequest) (*model.ZoneResponse, error) {
	z, err := s.repo.CreateZone(ctx, req.Name, req.Type, req.Status, req.Lat, req.Lng, req.Description, req.Photos)
	if err != nil {
		return nil, err
	}
	return toZoneResponse(z), nil
}

func (s *ZoneService) Get(ctx context.Context, id string) (*model.ZoneResponse, error) {
	z, err := s.repo.GetZone(ctx, id)
	if err != nil {
		return nil, err
	}
	if z == nil {
		return nil, ErrZoneNotFound
	}
	return toZoneResponse(z), nil
}

func (s *ZoneService) List(ctx context.Context) (*model.ListZonesResponse, error) {
	zones, err := s.repo.ListZones(ctx)
	if err != nil {
		return nil, err
	}
	resp := &model.ListZonesResponse{Zones: make([]model.ZoneResponse, 0, len(zones))}
	for _, z := range zones {
		resp.Zones = append(resp.Zones, *toZoneResponse(z))
	}
	return resp, nil
}

func (s *ZoneService) Update(ctx context.Context, id string, req model.UpdateZoneRequest) (*model.ZoneResponse, error) {
	z, err := s.repo.UpdateZone(ctx, id, req.Name, req.Type, req.Status, req.Lat, req.Lng, req.Description, req.Photos)
	if err != nil {
		return nil, err
	}
	if z == nil {
		return nil, ErrZoneNotFound
	}
	return toZoneResponse(z), nil
}

func (s *ZoneService) Delete(ctx context.Context, id string) error {
	return s.repo.DeleteZone(ctx, id)
}

func toZoneResponse(z *repository.ZoneEntity) *model.ZoneResponse {
	photos := z.Photos
	if photos == nil {
		photos = []string{}
	}
	return &model.ZoneResponse{
		ID:          z.ID,
		Name:        z.Name,
		Type:        z.Type,
		Status:      z.Status,
		Lat:         z.Lat,
		Lng:         z.Lng,
		Description: z.Description,
		Photos:      photos,
		CreatedAt:   z.CreatedAt,
		UpdatedAt:   z.UpdatedAt,
	}
}
