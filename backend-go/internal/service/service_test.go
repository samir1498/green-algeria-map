package service

import (
	"context"
	"testing"
	"time"

	"github.com/green-algeria-map/backend-go/internal/model"
	"github.com/green-algeria-map/backend-go/internal/repository"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAuthService_SignUp_Success(t *testing.T) {
	store := repository.NewInMemoryStore()
	svc := NewAuthService(store)

	resp, err := svc.SignUp(context.Background(), model.SignUpRequest{
		Email:    "test@test.com",
		Password: "password123",
		Name:     "Test User",
	})

	require.NoError(t, err)
	require.NotNil(t, resp.User)
	assert.Equal(t, "test@test.com", resp.User.Email)
	assert.Equal(t, "Test User", resp.User.Name)
	assert.Equal(t, "volunteer", resp.User.Role)
	assert.False(t, resp.User.EmailVerified)

	user, err := store.GetUserByEmail(context.Background(), "test@test.com")
	require.NoError(t, err)
	require.NotNil(t, user)
	assert.NotEmpty(t, user.PasswordHash)
	assert.NotEqual(t, "password123", user.PasswordHash)
}

func TestAuthService_SignUp_DuplicateEmail(t *testing.T) {
	svc := NewAuthService(repository.NewInMemoryStore())

	svc.SignUp(context.Background(), model.SignUpRequest{
		Email: "dup@test.com", Password: "password123", Name: "Test",
	})

	_, err := svc.SignUp(context.Background(), model.SignUpRequest{
		Email: "dup@test.com", Password: "password123", Name: "Test",
	})

	assert.ErrorIs(t, err, ErrEmailTaken)
}

func TestAuthService_SignIn_Success(t *testing.T) {
	svc := NewAuthService(repository.NewInMemoryStore())

	svc.SignUp(context.Background(), model.SignUpRequest{
		Email: "signin@test.com", Password: "password123", Name: "Test",
	})

	resp, sess, err := svc.SignIn(context.Background(), model.LoginRequest{
		Email: "signin@test.com", Password: "password123",
	})

	require.NoError(t, err)
	require.NotNil(t, resp.User)
	assert.Equal(t, "signin@test.com", resp.User.Email)
	require.NotNil(t, sess)
	assert.NotEmpty(t, sess.ID)
	assert.Equal(t, resp.User.ID, sess.UserID)
}

func TestAuthService_SignIn_WrongPassword(t *testing.T) {
	svc := NewAuthService(repository.NewInMemoryStore())

	svc.SignUp(context.Background(), model.SignUpRequest{
		Email: "wrongpw@test.com", Password: "password123", Name: "Test",
	})

	_, _, err := svc.SignIn(context.Background(), model.LoginRequest{
		Email: "wrongpw@test.com", Password: "wrong",
	})

	assert.ErrorIs(t, err, ErrInvalidCreds)
}

func TestAuthService_SignIn_UserNotFound(t *testing.T) {
	svc := NewAuthService(repository.NewInMemoryStore())

	_, _, err := svc.SignIn(context.Background(), model.LoginRequest{
		Email: "nobody@test.com", Password: "password123",
	})

	assert.ErrorIs(t, err, ErrInvalidCreds)
}

func TestAuthService_GetSession_Valid(t *testing.T) {
	svc := NewAuthService(repository.NewInMemoryStore())

	svc.SignUp(context.Background(), model.SignUpRequest{
		Email: "session@test.com", Password: "password123", Name: "Test",
	})

	_, sess, err := svc.SignIn(context.Background(), model.LoginRequest{
		Email: "session@test.com", Password: "password123",
	})
	require.NoError(t, err)

	resp, err := svc.GetSession(context.Background(), sess.ID)
	require.NoError(t, err)
	require.NotNil(t, resp.User)
	assert.Equal(t, "session@test.com", resp.User.Email)
}

func TestAuthService_GetSession_Invalid(t *testing.T) {
	svc := NewAuthService(repository.NewInMemoryStore())

	resp, err := svc.GetSession(context.Background(), "nonexistent")
	require.NoError(t, err)
	assert.Nil(t, resp.User)
}

func TestAuthService_SignOut(t *testing.T) {
	svc := NewAuthService(repository.NewInMemoryStore())

	svc.SignUp(context.Background(), model.SignUpRequest{
		Email: "signout@test.com", Password: "password123", Name: "Test",
	})

	_, sess, _ := svc.SignIn(context.Background(), model.LoginRequest{
		Email: "signout@test.com", Password: "password123",
	})

	err := svc.SignOut(context.Background(), sess.ID)
	require.NoError(t, err)

	resp, _ := svc.GetSession(context.Background(), sess.ID)
	assert.Nil(t, resp.User)
}

func TestCRUDService_Create(t *testing.T) {
	svc := NewCRUDService(repository.NewInMemoryStore())

	resp, err := svc.Create(context.Background(), model.CreateItemRequest{
		Name: "test item", Description: "desc",
	})

	require.NoError(t, err)
	assert.Equal(t, "test item", resp.Name)
	assert.Equal(t, "desc", resp.Description)
	assert.NotEmpty(t, resp.ID)
	assert.False(t, resp.CreatedAt.IsZero())
}

func TestCRUDService_Get(t *testing.T) {
	svc := NewCRUDService(repository.NewInMemoryStore())

	created, _ := svc.Create(context.Background(), model.CreateItemRequest{
		Name: "gettest", Description: "get desc",
	})

	retrieved, err := svc.Get(context.Background(), created.ID)
	require.NoError(t, err)
	assert.Equal(t, "gettest", retrieved.Name)
}

func TestCRUDService_Get_NotFound(t *testing.T) {
	svc := NewCRUDService(repository.NewInMemoryStore())

	_, err := svc.Get(context.Background(), uuid.New().String())
	assert.ErrorIs(t, err, ErrItemNotFound)
}

func TestCRUDService_List(t *testing.T) {
	svc := NewCRUDService(repository.NewInMemoryStore())

	svc.Create(context.Background(), model.CreateItemRequest{Name: "item1", Description: "desc1"})
	svc.Create(context.Background(), model.CreateItemRequest{Name: "item2", Description: "desc2"})

	resp, err := svc.List(context.Background())
	require.NoError(t, err)
	assert.Len(t, resp.Items, 2)
}

func TestCRUDService_Update(t *testing.T) {
	svc := NewCRUDService(repository.NewInMemoryStore())

	created, _ := svc.Create(context.Background(), model.CreateItemRequest{
		Name: "original", Description: "original desc",
	})

	updated, err := svc.Update(context.Background(), created.ID, model.UpdateItemRequest{
		Name: "updated", Description: "updated desc",
	})
	require.NoError(t, err)
	assert.Equal(t, "updated", updated.Name)
	assert.Equal(t, "updated desc", updated.Description)
	assert.True(t, updated.UpdatedAt.After(updated.CreatedAt) || updated.UpdatedAt.Equal(updated.CreatedAt))
}

func TestCRUDService_Delete(t *testing.T) {
	svc := NewCRUDService(repository.NewInMemoryStore())

	created, _ := svc.Create(context.Background(), model.CreateItemRequest{
		Name: "deleteme", Description: "bye",
	})

	err := svc.Delete(context.Background(), created.ID)
	require.NoError(t, err)

	_, err = svc.Get(context.Background(), created.ID)
	assert.ErrorIs(t, err, ErrItemNotFound)
}

func TestCRUDService_List_Empty(t *testing.T) {
	svc := NewCRUDService(repository.NewInMemoryStore())

	resp, err := svc.List(context.Background())
	require.NoError(t, err)
	assert.Empty(t, resp.Items)
}

func TestToUserResponse(t *testing.T) {
	now := time.Now().UTC()
	u := &repository.User{
		ID:            "abc",
		Name:          "John",
		Email:         "john@test.com",
		EmailVerified: true,
		Role:          "admin",
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	resp := toUserResponse(u)
	assert.Equal(t, "abc", resp.ID)
	assert.Equal(t, "John", resp.Name)
	assert.Equal(t, "john@test.com", resp.Email)
	assert.True(t, resp.EmailVerified)
	assert.Equal(t, "admin", resp.Role)
	assert.Equal(t, now, resp.CreatedAt)
}
