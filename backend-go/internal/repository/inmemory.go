package repository

import (
	"context"
	"sync"
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID            string
	Name          string
	Email         string
	EmailVerified bool
	Image         *string
	Role          string
	PasswordHash  string
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

type ItemEntity struct {
	ID          string
	Name        string
	Description string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type Session struct {
	ID        string
	UserID    string
	CreatedAt time.Time
}

type InMemoryStore struct {
	mu            sync.RWMutex
	users         map[string]*User
	emails        map[string]string
	items         map[string]*ItemEntity
	sessions      map[string]*Session
	zones         map[string]*ZoneEntity
	damageReports map[string]*DamageReportEntity
}

func NewInMemoryStore() *InMemoryStore {
	return &InMemoryStore{
		users:         make(map[string]*User),
		emails:        make(map[string]string),
		items:         make(map[string]*ItemEntity),
		sessions:      make(map[string]*Session),
		zones:         make(map[string]*ZoneEntity),
		damageReports: make(map[string]*DamageReportEntity),
	}
}

func (s *InMemoryStore) CreateUser(_ context.Context, name, email, passwordHash string) (*User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, exists := s.emails[email]; exists {
		return nil, ErrEmailTaken
	}
	now := time.Now().UTC()
	u := &User{
		ID:            uuid.New().String(),
		Name:          name,
		Email:         email,
		EmailVerified: false,
		Role:          "volunteer",
		PasswordHash:  passwordHash,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
	s.users[u.ID] = u
	s.emails[email] = u.ID
	return u, nil
}

func (s *InMemoryStore) GetUserByEmail(_ context.Context, email string) (*User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	id, ok := s.emails[email]
	if !ok {
		return nil, nil
	}
	u, ok := s.users[id]
	if !ok {
		return nil, nil
	}
	return u, nil
}

func (s *InMemoryStore) GetUserByID(_ context.Context, id string) (*User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	u, ok := s.users[id]
	if !ok {
		return nil, nil
	}
	return u, nil
}

func (s *InMemoryStore) UserExistsByEmail(_ context.Context, email string) (bool, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	_, ok := s.emails[email]
	return ok, nil
}

func (s *InMemoryStore) CreateSession(_ context.Context, userID string) (*Session, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	sess := &Session{
		ID:        uuid.New().String(),
		UserID:    userID,
		CreatedAt: time.Now().UTC(),
	}
	s.sessions[sess.ID] = sess
	return sess, nil
}

func (s *InMemoryStore) GetSession(_ context.Context, sessionID string) (*Session, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	sess, ok := s.sessions[sessionID]
	if !ok {
		return nil, nil
	}
	return sess, nil
}

func (s *InMemoryStore) DeleteSession(_ context.Context, sessionID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, sessionID)
	return nil
}

func (s *InMemoryStore) DeleteUser(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	u, ok := s.users[id]
	if ok {
		delete(s.emails, u.Email)
		delete(s.users, id)
	}
	return nil
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
func (s *InMemoryStore) CreateZone(_ context.Context, name, zoneType, status string, lat, lng float64, description string) (*ZoneEntity, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now().UTC()
	z := &ZoneEntity{
		ID:          uuid.New().String(),
		Name:        name,
		Type:        zoneType,
		Status:      status,
		Lat:         lat,
		Lng:         lng,
		Description: description,
		CreatedAt:   now,
		UpdatedAt:   now,
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

func (s *InMemoryStore) UpdateZone(_ context.Context, id, name, zoneType, status string, lat, lng float64, description string) (*ZoneEntity, error) {
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
	z.Description = description
	z.UpdatedAt = time.Now().UTC()
	return z, nil
}

func (s *InMemoryStore) DeleteZone(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.zones, id)
	return nil
}

// --- Damage Reports ---
func (s *InMemoryStore) CreateDamageReport(_ context.Context, zoneID *string, title, description, severity string, lat, lng float64) (*DamageReportEntity, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	now := time.Now().UTC()
	dr := &DamageReportEntity{
		ID:          uuid.New().String(),
		ZoneID:      zoneID,
		Title:       title,
		Description: description,
		Severity:    severity,
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
	s.mu.RLock()
	defer s.mu.RUnlock()
	reports := make([]*DamageReportEntity, 0, len(s.damageReports))
	for _, dr := range s.damageReports {
		reports = append(reports, dr)
	}
	return reports, nil
}
