package repository

import (
	"context"
	"sync"
	"time"

	"github.com/google/uuid"
)

type ItemEntity struct {
	ID          string
	Name        string
	Description string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type InMemoryStore struct {
	mu            sync.RWMutex
	items         map[string]*ItemEntity
	zones         map[string]*ZoneEntity
	damageReports map[string]*DamageReportEntity
}

func NewInMemoryStore() *InMemoryStore {
	return &InMemoryStore{
		items:         make(map[string]*ItemEntity),
		zones:         make(map[string]*ZoneEntity),
		damageReports: make(map[string]*DamageReportEntity),
	}
}

func (s *InMemoryStore) CreateItem(_ context.Context, name, description string) (*ItemEntity, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now().UTC()
	it := &ItemEntity{
		ID:          uuid.New().String(),
		Name:        name,
		Description: description,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	s.items[it.ID] = it
	return it, nil
}

func (s *InMemoryStore) GetItem(_ context.Context, id string) (*ItemEntity, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	it, ok := s.items[id]
	if !ok {
		return nil, nil
	}
	return it, nil
}

func (s *InMemoryStore) ListItems(_ context.Context) ([]*ItemEntity, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	items := make([]*ItemEntity, 0, len(s.items))
	for _, it := range s.items {
		items = append(items, it)
	}
	return items, nil
}

func (s *InMemoryStore) UpdateItem(_ context.Context, id, name, description string) (*ItemEntity, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	it, ok := s.items[id]
	if !ok {
		return nil, nil
	}
	it.Name = name
	it.Description = description
	it.UpdatedAt = time.Now().UTC()
	return it, nil
}

func (s *InMemoryStore) DeleteItem(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.items, id)
	return nil
}

// --- Zones ---
func (s *InMemoryStore) CreateZone(_ context.Context, name, zoneType, status string, lat, lng float64, targetCount, currentCount *int, description, treeSpecies, organizerContact string, volunteerCount int, photos []string) (*ZoneEntity, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now().UTC()
	if photos == nil {
		photos = []string{}
	}
	z := &ZoneEntity{
		ID:               uuid.New().String(),
		Name:             name,
		Type:             zoneType,
		Status:           status,
		Lat:              lat,
		Lng:              lng,
		TargetCount:      targetCount,
		CurrentCount:     currentCount,
		Description:      description,
		TreeSpecies:      treeSpecies,
		OrganizerContact: organizerContact,
		VolunteerCount:   volunteerCount,
		Photos:           photos,
		CreatedAt:        now,
		UpdatedAt:        now,
	}
	s.zones[z.ID] = z
	return z, nil
}

func (s *InMemoryStore) GetZone(_ context.Context, id string) (*ZoneEntity, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	z, ok := s.zones[id]
	if !ok {
		return nil, nil
	}
	return z, nil
}

func (s *InMemoryStore) ListZones(_ context.Context) ([]*ZoneEntity, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	zones := make([]*ZoneEntity, 0, len(s.zones))
	for _, z := range s.zones {
		zones = append(zones, z)
	}
	return zones, nil
}

func (s *InMemoryStore) UpdateZone(_ context.Context, id, name, zoneType, status string, lat, lng float64, targetCount, currentCount *int, description, treeSpecies, organizerContact string, volunteerCount int, photos []string) (*ZoneEntity, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	z, ok := s.zones[id]
	if !ok {
		return nil, nil
	}
	z.Name = name
	z.Type = zoneType
	z.Status = status
	z.Lat = lat
	z.Lng = lng
	z.TargetCount = targetCount
	z.CurrentCount = currentCount
	z.Description = description
	z.TreeSpecies = treeSpecies
	z.OrganizerContact = organizerContact
	z.VolunteerCount = volunteerCount
	if photos == nil {
		photos = []string{}
	}
	z.Photos = photos
	z.UpdatedAt = time.Now().UTC()
	return z, nil
}

func (s *InMemoryStore) UpdateZoneVolunteer(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	z, ok := s.zones[id]
	if !ok {
		return nil
	}
	z.VolunteerCount++
	z.UpdatedAt = time.Now().UTC()
	return nil
}

func (s *InMemoryStore) AddZonePhoto(_ context.Context, id, photoURL string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	z, ok := s.zones[id]
	if !ok {
		return nil
	}
	z.Photos = append(z.Photos, photoURL)
	z.UpdatedAt = time.Now().UTC()
	return nil
}

func (s *InMemoryStore) DeleteZone(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.zones, id)
	return nil
}

// --- Damage Reports ---
func (s *InMemoryStore) CreateDamageReport(_ context.Context, zoneID *string, title, description, severity, status, reportedBy, reportType string, lat, lng float64) (*DamageReportEntity, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now().UTC()
	dr := &DamageReportEntity{
		ID:          uuid.New().String(),
		ZoneID:      zoneID,
		Title:       title,
		Description: description,
		Severity:    severity,
		Type:        reportType,
		Status:      status,
		ReportedBy:  &reportedBy,
		Lat:         lat,
		Lng:         lng,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	s.damageReports[dr.ID] = dr
	return dr, nil
}

func (s *InMemoryStore) GetDamageReport(_ context.Context, id string) (*DamageReportEntity, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	dr, ok := s.damageReports[id]
	if !ok {
		return nil, nil
	}
	return dr, nil
}

func (s *InMemoryStore) ListDamageReports(_ context.Context) ([]*DamageReportEntity, error) {
	return s.ListDamageReportsByZone(context.Background(), nil)
}

func (s *InMemoryStore) ListDamageReportsByZone(_ context.Context, zoneID *string) ([]*DamageReportEntity, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	reports := make([]*DamageReportEntity, 0, len(s.damageReports))
	for _, dr := range s.damageReports {
		if zoneID != nil && (dr.ZoneID == nil || *dr.ZoneID != *zoneID) {
			continue
		}
		reports = append(reports, dr)
	}
	return reports, nil
}

func (s *InMemoryStore) UpdateDamageReportStatus(_ context.Context, id, status string) (*DamageReportEntity, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	dr, ok := s.damageReports[id]
	if !ok {
		return nil, nil
	}
	dr.Status = status
	dr.UpdatedAt = time.Now().UTC()
	return dr, nil
}

func (s *InMemoryStore) DeleteDamageReport(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.damageReports, id)
	return nil
}
