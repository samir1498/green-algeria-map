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

func (s *PostgresStore) DeleteUser(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
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

// --- Zones ---
func (s *PostgresStore) CreateZone(ctx context.Context, name, zoneType, status string, lat, lng float64, targetCount, currentCount *int, description, treeSpecies, organizerContact string, volunteerCount int, photos []string) (*ZoneEntity, error) {
	id := uuid.New().String()
	now := time.Now().UTC()
	z := &ZoneEntity{}
	if photos == nil {
		photos = []string{}
	}
	err := s.pool.QueryRow(ctx,
		`INSERT INTO zones (id, name, type, status, lat, lng, target_count, current_count, description, tree_species, organizer_contact, volunteer_count, photos, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
		 RETURNING id, name, type, status, lat, lng, target_count, current_count, description, tree_species, organizer_contact, volunteer_count, photos, created_at, updated_at`,
		id, name, zoneType, status, lat, lng, targetCount, currentCount, description, treeSpecies, organizerContact, volunteerCount, photos, now, now,
	).Scan(&z.ID, &z.Name, &z.Type, &z.Status, &z.Lat, &z.Lng, &z.TargetCount, &z.CurrentCount, &z.Description, &z.TreeSpecies, &z.OrganizerContact, &z.VolunteerCount, &z.Photos, &z.CreatedAt, &z.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create zone: %w", err)
	}
	return z, nil
}

func (s *PostgresStore) GetZone(ctx context.Context, id string) (*ZoneEntity, error) {
	z := &ZoneEntity{}
	err := s.pool.QueryRow(ctx,
		`SELECT id, name, type, status, lat, lng, target_count, current_count, description, tree_species, organizer_contact, volunteer_count, photos, created_at, updated_at FROM zones WHERE id = $1`, id,
	).Scan(&z.ID, &z.Name, &z.Type, &z.Status, &z.Lat, &z.Lng, &z.TargetCount, &z.CurrentCount, &z.Description, &z.TreeSpecies, &z.OrganizerContact, &z.VolunteerCount, &z.Photos, &z.CreatedAt, &z.UpdatedAt)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, fmt.Errorf("get zone: %w", err)
	}
	return z, nil
}

func (s *PostgresStore) ListZones(ctx context.Context) ([]*ZoneEntity, error) {
	rows, err := s.pool.Query(ctx, `SELECT id, name, type, status, lat, lng, target_count, current_count, description, tree_species, organizer_contact, volunteer_count, photos, created_at, updated_at FROM zones ORDER BY created_at`)
	if err != nil {
		return nil, fmt.Errorf("list zones: %w", err)
	}
	defer rows.Close()
	var zones []*ZoneEntity
	for rows.Next() {
		z := &ZoneEntity{}
		if err := rows.Scan(&z.ID, &z.Name, &z.Type, &z.Status, &z.Lat, &z.Lng, &z.TargetCount, &z.CurrentCount, &z.Description, &z.TreeSpecies, &z.OrganizerContact, &z.VolunteerCount, &z.Photos, &z.CreatedAt, &z.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan zone: %w", err)
		}
		zones = append(zones, z)
	}
	return zones, rows.Err()
}

func (s *PostgresStore) UpdateZone(ctx context.Context, id, name, zoneType, status string, lat, lng float64, targetCount, currentCount *int, description, treeSpecies, organizerContact string, volunteerCount int, photos []string) (*ZoneEntity, error) {
	now := time.Now().UTC()
	z := &ZoneEntity{}
	if photos == nil {
		photos = []string{}
	}
	err := s.pool.QueryRow(ctx,
		`UPDATE zones SET name = $2, type = $3, status = $4, lat = $5, lng = $6, target_count = $7, current_count = $8, description = $9, tree_species = $10, organizer_contact = $11, volunteer_count = $12, photos = $13, updated_at = $14 WHERE id = $1
		 RETURNING id, name, type, status, lat, lng, target_count, current_count, description, tree_species, organizer_contact, volunteer_count, photos, created_at, updated_at`,
		id, name, zoneType, status, lat, lng, targetCount, currentCount, description, treeSpecies, organizerContact, volunteerCount, photos, now,
	).Scan(&z.ID, &z.Name, &z.Type, &z.Status, &z.Lat, &z.Lng, &z.TargetCount, &z.CurrentCount, &z.Description, &z.TreeSpecies, &z.OrganizerContact, &z.VolunteerCount, &z.Photos, &z.CreatedAt, &z.UpdatedAt)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, fmt.Errorf("update zone: %w", err)
	}
	return z, nil
}

func (s *PostgresStore) UpdateZoneVolunteer(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `UPDATE zones SET volunteer_count = volunteer_count + 1, updated_at = NOW() WHERE id = $1`, id)
	return err
}

func (s *PostgresStore) AddZonePhoto(ctx context.Context, id, photoURL string) error {
	_, err := s.pool.Exec(ctx, `UPDATE zones SET photos = array_append(photos, $2), updated_at = NOW() WHERE id = $1`, id, photoURL)
	return err
}

func (s *PostgresStore) DeleteZone(ctx context.Context, id string) error {
	_, err := s.pool.Exec(ctx, `DELETE FROM zones WHERE id = $1`, id)
	return err
}

// --- Damage Reports ---
func (s *PostgresStore) CreateDamageReport(ctx context.Context, zoneID *string, title, description, severity string, lat, lng float64) (*DamageReportEntity, error) {
	id := uuid.New().String()
	now := time.Now().UTC()
	dr := &DamageReportEntity{}
	err := s.pool.QueryRow(ctx,
		`INSERT INTO damage_reports (id, zone_id, title, description, severity, lat, lng, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		 RETURNING id, zone_id, title, description, severity, lat, lng, created_at, updated_at`,
		id, zoneID, title, description, severity, lat, lng, now, now,
	).Scan(&dr.ID, &dr.ZoneID, &dr.Title, &dr.Description, &dr.Severity, &dr.Lat, &dr.Lng, &dr.CreatedAt, &dr.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create damage report: %w", err)
	}
	return dr, nil
}

func (s *PostgresStore) GetDamageReport(ctx context.Context, id string) (*DamageReportEntity, error) {
	dr := &DamageReportEntity{}
	err := s.pool.QueryRow(ctx,
		`SELECT id, zone_id, title, description, severity, lat, lng, created_at, updated_at FROM damage_reports WHERE id = $1`, id,
	).Scan(&dr.ID, &dr.ZoneID, &dr.Title, &dr.Description, &dr.Severity, &dr.Lat, &dr.Lng, &dr.CreatedAt, &dr.UpdatedAt)
	if err != nil {
		if err.Error() == "no rows in result set" {
			return nil, nil
		}
		return nil, fmt.Errorf("get damage report: %w", err)
	}
	return dr, nil
}

func (s *PostgresStore) ListDamageReports(ctx context.Context) ([]*DamageReportEntity, error) {
	rows, err := s.pool.Query(ctx, `SELECT id, zone_id, title, description, severity, lat, lng, created_at, updated_at FROM damage_reports ORDER BY created_at`)
	if err != nil {
		return nil, fmt.Errorf("list damage reports: %w", err)
	}
	defer rows.Close()
	var reports []*DamageReportEntity
	for rows.Next() {
		dr := &DamageReportEntity{}
		if err := rows.Scan(&dr.ID, &dr.ZoneID, &dr.Title, &dr.Description, &dr.Severity, &dr.Lat, &dr.Lng, &dr.CreatedAt, &dr.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan damage report: %w", err)
		}
		reports = append(reports, dr)
	}
	return reports, rows.Err()
}

type ZoneEntity struct {
	ID               string    `json:"id"`
	Name             string    `json:"name"`
	Type             string    `json:"type"`
	Status           string    `json:"status"`
	Lat              float64   `json:"lat"`
	Lng              float64   `json:"lng"`
	TargetCount      *int      `json:"targetCount"`
	CurrentCount     *int      `json:"currentCount"`
	Description      string    `json:"description"`
	TreeSpecies      string    `json:"treeSpecies"`
	OrganizerContact string    `json:"organizerContact"`
	VolunteerCount   int       `json:"volunteerCount"`
	Photos           []string  `json:"photos"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

type DamageReportEntity struct {
	ID          string    `json:"id"`
	ZoneID      *string   `json:"zone_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Severity    string    `json:"severity"`
	Lat         float64   `json:"lat"`
	Lng         float64   `json:"lng"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}
