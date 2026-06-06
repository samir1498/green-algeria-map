package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresStore struct {
	pool *pgxpool.Pool
}

func NewPostgresStore(pool *pgxpool.Pool) *PostgresStore {
	return &PostgresStore{pool: pool}
}

func (s *PostgresStore) UserExistsByEmail(ctx context.Context, email string) (bool, error) {
	var exists bool
	err := s.pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`, email).Scan(&exists)
	return exists, err
}

func (s *PostgresStore) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	u := &User{}
	err := s.pool.QueryRow(ctx,
		`SELECT id, name, email, email_verified, image, role, password_hash, created_at, updated_at FROM users WHERE email = $1`,
		email,
	).Scan(&u.ID, &u.Name, &u.Email, &u.EmailVerified, &u.Image, &u.Role, &u.PasswordHash, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, fmt.Errorf("get user by email: %w", err)
	}
	return u, nil
}

func (s *PostgresStore) GetUserByID(ctx context.Context, id string) (*User, error) {
	u := &User{}
	err := s.pool.QueryRow(ctx,
		`SELECT id, name, email, email_verified, image, role, password_hash, created_at, updated_at FROM users WHERE id = $1`,
		id,
	).Scan(&u.ID, &u.Name, &u.Email, &u.EmailVerified, &u.Image, &u.Role, &u.PasswordHash, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, fmt.Errorf("get user by id: %w", err)
	}
	return u, nil
}

func (s *PostgresStore) CreateUser(ctx context.Context, name, email, passwordHash string) (*User, error) {
	id := uuid.New().String()
	now := time.Now().UTC()
	u := &User{}
	err := s.pool.QueryRow(ctx,
		`INSERT INTO users (id, name, email, email_verified, role, password_hash, created_at, updated_at)
		 VALUES ($1, $2, $3, false, 'volunteer', $4, $5, $6)
		 RETURNING id, name, email, email_verified, image, role, password_hash, created_at, updated_at`,
		id, name, email, passwordHash, now, now,
	).Scan(&u.ID, &u.Name, &u.Email, &u.EmailVerified, &u.Image, &u.Role, &u.PasswordHash, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	return u, nil
}

func (s *PostgresStore) CreateSession(ctx context.Context, userID string) (*Session, error) {
	sessID := uuid.New().String()
	now := time.Now().UTC()
	sess := &Session{}
	err := s.pool.QueryRow(ctx,
		`INSERT INTO sessions (id, user_id, created_at) VALUES ($1, $2, $3)
		 RETURNING id, user_id, created_at`,
		sessID, userID, now,
	).Scan(&sess.ID, &sess.UserID, &sess.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("create session: %w", err)
	}
	return sess, nil
}

func (s *PostgresStore) GetSession(ctx context.Context, sessionID string) (*Session, error) {
	sess := &Session{}
	err := s.pool.QueryRow(ctx,
		`SELECT id, user_id, created_at FROM sessions WHERE id = $1`,
		sessionID,
	).Scan(&sess.ID, &sess.UserID, &sess.CreatedAt)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, fmt.Errorf("get session: %w", err)
	}
	return sess, nil
}

func (s *PostgresStore) DeleteSession(ctx context.Context, sessionID string) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM sessions WHERE id = $1`, sessionID)
	return err
}

func (s *PostgresStore) CreateItem(ctx context.Context, name, description string) (*ItemEntity, error) {
	itemID := uuid.New().String()
	now := time.Now().UTC()
	it := &ItemEntity{}
	err := s.pool.QueryRow(ctx,
		`INSERT INTO items (id, name, description, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, name, description, created_at, updated_at`,
		itemID, name, description, now, now,
	).Scan(&it.ID, &it.Name, &it.Description, &it.CreatedAt, &it.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create item: %w", err)
	}
	return it, nil
}

func (s *PostgresStore) GetItem(ctx context.Context, id string) (*ItemEntity, error) {
	it := &ItemEntity{}
	err := s.pool.QueryRow(ctx,
		`SELECT id, name, description, created_at, updated_at FROM items WHERE id = $1`, id,
	).Scan(&it.ID, &it.Name, &it.Description, &it.CreatedAt, &it.UpdatedAt)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, fmt.Errorf("get item: %w", err)
	}
	return it, nil
}

func (s *PostgresStore) ListItems(ctx context.Context) ([]*ItemEntity, error) {
	rows, err := s.pool.Query(ctx, `SELECT id, name, description, created_at, updated_at FROM items ORDER BY created_at`)
	if err != nil {
		return nil, fmt.Errorf("list items: %w", err)
	}
	defer rows.Close()
	var items []*ItemEntity
	for rows.Next() {
		it := &ItemEntity{}
		if err := rows.Scan(&it.ID, &it.Name, &it.Description, &it.CreatedAt, &it.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan item: %w", err)
		}
		items = append(items, it)
	}
	return items, rows.Err()
}

func (s *PostgresStore) UpdateItem(ctx context.Context, id, name, description string) (*ItemEntity, error) {
	now := time.Now().UTC()
	it := &ItemEntity{}
	err := s.pool.QueryRow(ctx,
		`UPDATE items SET name = $2, description = $3, updated_at = $4 WHERE id = $1
		 RETURNING id, name, description, created_at, updated_at`,
		id, name, description, now,
	).Scan(&it.ID, &it.Name, &it.Description, &it.CreatedAt, &it.UpdatedAt)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, fmt.Errorf("update item: %w", err)
	}
	return it, nil
}

func (s *PostgresStore) DeleteItem(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM items WHERE id = $1`, id)
	return err
}
