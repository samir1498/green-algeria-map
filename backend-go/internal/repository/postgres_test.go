package repository

import (
	"context"
	"flag"
	"fmt"
	"os"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
	"golang.org/x/crypto/bcrypt"
)

var (
	testPool        *pgxpool.Pool
	testContainer   testcontainers.Container
)

func TestMain(m *testing.M) {
	flag.Parse()
	if testing.Short() {
		os.Exit(m.Run())
	}

	ctx := context.Background()

	pgContainer, err := postgres.Run(ctx,
		"postgres:16-alpine",
		postgres.WithDatabase("testdb"),
		postgres.WithUsername("test"),
		postgres.WithPassword("test"),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2),
		),
	)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to start postgres container: %v\n", err)
		os.Exit(1)
	}

	connStr, err := pgContainer.ConnectionString(ctx, "sslmode=disable")
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to get connection string: %v\n", err)
		os.Exit(1)
	}

	pool, err := pgxpool.New(ctx, connStr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to create pool: %v\n", err)
		os.Exit(1)
	}

	_, err = pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			email TEXT NOT NULL UNIQUE,
			email_verified BOOLEAN NOT NULL DEFAULT false,
			image TEXT,
			role TEXT NOT NULL DEFAULT 'volunteer',
			password_hash TEXT NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
		CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
		CREATE TABLE IF NOT EXISTS items (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			description TEXT NOT NULL DEFAULT '',
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
	`)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to create tables: %v\n", err)
		os.Exit(1)
	}

	testPool = pool
	testContainer = pgContainer

	code := m.Run()

	pool.Close()
	pgContainer.Terminate(ctx)
	os.Exit(code)
}

func setupTestDB(t *testing.T) *pgxpool.Pool {
	t.Helper()
	ctx := context.Background()
	testPool.Exec(ctx, `DELETE FROM items`)
	testPool.Exec(ctx, `DELETE FROM sessions`)
	testPool.Exec(ctx, `DELETE FROM users`)
	return testPool
}

func hashPassword(t *testing.T, password string) string {
	t.Helper()
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 4)
	require.NoError(t, err)
	return string(hash)
}

func TestIntegration_Postgres_CreateAndGetUser(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	pool := setupTestDB(t)
	store := NewPostgresStore(pool)
	ctx := context.Background()

	hash := hashPassword(t, "password123")
	user, err := store.CreateUser(ctx, "Test User", "test@test.com", hash)
	require.NoError(t, err)
	assert.NotEmpty(t, user.ID)

	retrieved, err := store.GetUserByEmail(ctx, "test@test.com")
	require.NoError(t, err)
	require.NotNil(t, retrieved)
	assert.Equal(t, user.ID, retrieved.ID)
	assert.Equal(t, hash, retrieved.PasswordHash)
}

func TestIntegration_Postgres_UserExistsByEmail(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	pool := setupTestDB(t)
	store := NewPostgresStore(pool)
	ctx := context.Background()

	exists, err := store.UserExistsByEmail(ctx, "nonexistent@test.com")
	require.NoError(t, err)
	assert.False(t, exists)

	hash := hashPassword(t, "password123")
	store.CreateUser(ctx, "Test", "exists@test.com", hash)

	exists, err = store.UserExistsByEmail(ctx, "exists@test.com")
	require.NoError(t, err)
	assert.True(t, exists)
}

func TestIntegration_Postgres_SessionLifecycle(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	pool := setupTestDB(t)
	store := NewPostgresStore(pool)
	ctx := context.Background()

	hash := hashPassword(t, "password123")
	user, _ := store.CreateUser(ctx, "Session User", "session@test.com", hash)

	sess, err := store.CreateSession(ctx, user.ID)
	require.NoError(t, err)
	assert.NotEmpty(t, sess.ID)
	assert.Equal(t, user.ID, sess.UserID)

	retrieved, err := store.GetSession(ctx, sess.ID)
	require.NoError(t, err)
	require.NotNil(t, retrieved)
	assert.Equal(t, sess.ID, retrieved.ID)

	err = store.DeleteSession(ctx, sess.ID)
	require.NoError(t, err)

	deleted, err := store.GetSession(ctx, sess.ID)
	require.NoError(t, err)
	assert.Nil(t, deleted)
}

func TestIntegration_Postgres_ItemCRUD(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	pool := setupTestDB(t)
	store := NewPostgresStore(pool)
	ctx := context.Background()

	created, err := store.CreateItem(ctx, "item1", "description1")
	require.NoError(t, err)
	assert.NotEmpty(t, created.ID)
	assert.Equal(t, "item1", created.Name)

	retrieved, err := store.GetItem(ctx, created.ID)
	require.NoError(t, err)
	require.NotNil(t, retrieved)
	assert.Equal(t, "item1", retrieved.Name)

	updated, err := store.UpdateItem(ctx, created.ID, "updated", "updated desc")
	require.NoError(t, err)
	require.NotNil(t, updated)
	assert.Equal(t, "updated", updated.Name)

	items, err := store.ListItems(ctx)
	require.NoError(t, err)
	assert.Len(t, items, 1)
	assert.Equal(t, "updated", items[0].Name)

	err = store.DeleteItem(ctx, created.ID)
	require.NoError(t, err)

	deleted, err := store.GetItem(ctx, created.ID)
	require.NoError(t, err)
	assert.Nil(t, deleted)

	emptyList, err := store.ListItems(ctx)
	require.NoError(t, err)
	assert.Empty(t, emptyList)
}

func TestIntegration_Postgres_GetUserByID(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping integration test")
	}

	pool := setupTestDB(t)
	store := NewPostgresStore(pool)
	ctx := context.Background()

	hash := hashPassword(t, "password123")
	user, _ := store.CreateUser(ctx, "ID Test", "idtest@test.com", hash)

	retrieved, err := store.GetUserByID(ctx, user.ID)
	require.NoError(t, err)
	require.NotNil(t, retrieved)
	assert.Equal(t, "ID Test", retrieved.Name)
	assert.Equal(t, "idtest@test.com", retrieved.Email)
}
