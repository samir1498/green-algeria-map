package service

import (
	"context"
	"errors"
	"fmt"

	lru "github.com/hashicorp/golang-lru/v2"
	"github.com/green-algeria-map/backend-go/internal/model"
	"github.com/green-algeria-map/backend-go/internal/repository"
)

type ZoneRepository interface {
	CreateZone(ctx context.Context, name, zoneType, status string, lat, lng float64, targetCount, currentCount *int, description, treeSpecies, organizerContact string, volunteerCount int, photos []string) (*repository.ZoneEntity, error)
	GetZone(ctx context.Context, id string) (*repository.ZoneEntity, error)
	ListZones(ctx context.Context) ([]*repository.ZoneEntity, error)
	UpdateZone(ctx context.Context, id, name, zoneType, status string, lat, lng float64, targetCount, currentCount *int, description, treeSpecies, organizerContact string, volunteerCount int, photos []string) (*repository.ZoneEntity, error)
	UpdateZoneVolunteer(ctx context.Context, id string) error
	AddZonePhoto(ctx context.Context, id, photoURL string) error
	DeleteZone(ctx context.Context, id string) error
}

type ZoneService struct {
	repo  ZoneRepository
	cache *lru.Cache[string, any]
}

var ErrZoneNotFound = errors.New("zone not found")

func NewZoneService(repo ZoneRepository) *ZoneService {
	c, _ := lru.New[string, any](500)
	return &ZoneService{repo: repo, cache: c}
}

func (s *ZoneService) Create(ctx context.Context, req model.CreateZoneRequest) (*model.ZoneResponse, error) {
	z, err := s.repo.CreateZone(ctx, req.Name, req.Type, req.Status, req.Lat, req.Lng, req.TargetCount, req.CurrentCount, req.Description, req.TreeSpecies, req.OrganizerContact, req.VolunteerCount, req.Photos)
	if err != nil {
		return nil, err
	}
	s.cache.Remove("zones:all")
	return toZoneResponse(z), nil
}

func (s *ZoneService) Get(ctx context.Context, id string) (*model.ZoneResponse, error) {
	key := fmt.Sprintf("zone:%s", id)
	if v, ok := s.cache.Get(key); ok {
		return v.(*model.ZoneResponse), nil
	}
	z, err := s.repo.GetZone(ctx, id)
	if err != nil {
		return nil, err
	}
	if z == nil {
		return nil, ErrZoneNotFound
	}
	resp := toZoneResponse(z)
	s.cache.Add(key, resp)
	return resp, nil
}

func (s *ZoneService) List(ctx context.Context) (*model.ListZonesResponse, error) {
	if v, ok := s.cache.Get("zones:all"); ok {
		return v.(*model.ListZonesResponse), nil
	}
	zones, err := s.repo.ListZones(ctx)
	if err != nil {
		return nil, err
	}
	resp := &model.ListZonesResponse{Zones: make([]model.ZoneResponse, 0, len(zones))}
	for _, z := range zones {
		resp.Zones = append(resp.Zones, *toZoneResponse(z))
	}
	s.cache.Add("zones:all", resp)
	return resp, nil
}

func (s *ZoneService) Update(ctx context.Context, id string, req model.UpdateZoneRequest) (*model.ZoneResponse, error) {
	z, err := s.repo.UpdateZone(ctx, id, req.Name, req.Type, req.Status, req.Lat, req.Lng, req.TargetCount, req.CurrentCount, req.Description, req.TreeSpecies, req.OrganizerContact, req.VolunteerCount, req.Photos)
	if err != nil {
		return nil, err
	}
	if z == nil {
		return nil, ErrZoneNotFound
	}
	s.cache.Remove("zones:all")
	s.cache.Remove(fmt.Sprintf("zone:%s", id))
	return toZoneResponse(z), nil
}

func (s *ZoneService) RegisterVolunteer(ctx context.Context, id string) (*model.ZoneResponse, error) {
	if err := s.repo.UpdateZoneVolunteer(ctx, id); err != nil {
		return nil, err
	}
	s.cache.Remove("zones:all")
	s.cache.Remove(fmt.Sprintf("zone:%s", id))
	return s.Get(ctx, id)
}

func (s *ZoneService) AddPhoto(ctx context.Context, id, photoURL string) (*model.ZoneResponse, error) {
	if err := s.repo.AddZonePhoto(ctx, id, photoURL); err != nil {
		return nil, err
	}
	s.cache.Remove("zones:all")
	s.cache.Remove(fmt.Sprintf("zone:%s", id))
	return s.Get(ctx, id)
}

func (s *ZoneService) Delete(ctx context.Context, id string) error {
	if err := s.repo.DeleteZone(ctx, id); err != nil {
		return err
	}
	s.cache.Remove("zones:all")
	s.cache.Remove(fmt.Sprintf("zone:%s", id))
	return nil
}

func toZoneResponse(z *repository.ZoneEntity) *model.ZoneResponse {
	photos := z.Photos
	if photos == nil {
		photos = []string{}
	}
	return &model.ZoneResponse{
		ID:               z.ID,
		Name:             z.Name,
		Type:             z.Type,
		Status:           z.Status,
		Lat:              z.Lat,
		Lng:              z.Lng,
		TargetCount:      z.TargetCount,
		CurrentCount:     z.CurrentCount,
		Description:      z.Description,
		TreeSpecies:      z.TreeSpecies,
		OrganizerContact: z.OrganizerContact,
		VolunteerCount:   z.VolunteerCount,
		Photos:           photos,
		CreatedAt:        z.CreatedAt,
		UpdatedAt:        z.UpdatedAt,
	}
}
