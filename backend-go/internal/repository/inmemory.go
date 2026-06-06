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
	mu       sync.RWMutex
	users    map[string]*User
	emails   map[string]string
	items    map[string]*ItemEntity
	sessions map[string]*Session
}

func NewInMemoryStore() *InMemoryStore {
	return &InMemoryStore{
		users:    make(map[string]*User),
		emails:   make(map[string]string),
		items:    make(map[string]*ItemEntity),
		sessions: make(map[string]*Session),
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
