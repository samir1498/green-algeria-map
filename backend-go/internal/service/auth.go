package service

import (
	"context"
	"errors"

	"github.com/green-algeria-map/backend-go/internal/model"
	"github.com/green-algeria-map/backend-go/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type AuthRepository interface {
	CreateUser(ctx context.Context, name, email, passwordHash string) (*repository.User, error)
	GetUserByEmail(ctx context.Context, email string) (*repository.User, error)
	GetUserByID(ctx context.Context, id string) (*repository.User, error)
	UserExistsByEmail(ctx context.Context, email string) (bool, error)
	CreateSession(ctx context.Context, userID string) (*repository.Session, error)
	GetSession(ctx context.Context, sessionID string) (*repository.Session, error)
	DeleteSession(ctx context.Context, sessionID string) error
	DeleteUser(ctx context.Context, userID string) error
}

var (
	ErrEmailTaken     = errors.New("email already registered")
	ErrInvalidCreds   = errors.New("invalid email or password")
	ErrUserNotFound   = errors.New("user not found")
	ErrSessionExpired = errors.New("session not found")
)

type AuthService struct {
	repo AuthRepository
}

func NewAuthService(repo AuthRepository) *AuthService {
	return &AuthService{repo: repo}
}

func (s *AuthService) SignUpWithSession(ctx context.Context, req model.SignUpRequest) (*model.AuthResponse, *repository.Session, error) {
	exists, err := s.repo.UserExistsByEmail(ctx, req.Email)
	if err != nil {
		return nil, nil, err
	}
	if exists {
		return nil, nil, ErrEmailTaken
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		return nil, nil, err
	}
	user, err := s.repo.CreateUser(ctx, req.Name, req.Email, string(hash))
	if err != nil {
		return nil, nil, err
	}
	sess, err := s.repo.CreateSession(ctx, user.ID)
	if err != nil {
		_ = s.repo.DeleteUser(ctx, user.ID)
		return nil, nil, err
	}
	return &model.AuthResponse{User: toUserResponse(user)}, sess, nil
}

func (s *AuthService) SignUp(ctx context.Context, req model.SignUpRequest) (*model.AuthResponse, error) {
	exists, err := s.repo.UserExistsByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrEmailTaken
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		return nil, err
	}
	user, err := s.repo.CreateUser(ctx, req.Name, req.Email, string(hash))
	if err != nil {
		return nil, err
	}
	return &model.AuthResponse{User: toUserResponse(user)}, nil
}

func (s *AuthService) SignIn(ctx context.Context, req model.LoginRequest) (*model.AuthResponse, *repository.Session, error) {
	user, err := s.repo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		return nil, nil, err
	}
	if user == nil {
		return nil, nil, ErrInvalidCreds
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, nil, ErrInvalidCreds
	}
	sess, err := s.repo.CreateSession(ctx, user.ID)
	if err != nil {
		return nil, nil, err
	}
	return &model.AuthResponse{User: toUserResponse(user)}, sess, nil
}

func (s *AuthService) GetSession(ctx context.Context, sessionID string) (*model.SessionResponse, error) {
	sess, err := s.repo.GetSession(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	if sess == nil {
		return &model.SessionResponse{User: nil}, nil
	}
	user, err := s.repo.GetUserByID(ctx, sess.UserID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return &model.SessionResponse{User: nil}, nil
	}
	return &model.SessionResponse{User: toUserResponse(user)}, nil
}

func (s *AuthService) SignOut(ctx context.Context, sessionID string) error {
	return s.repo.DeleteSession(ctx, sessionID)
}

func toUserResponse(u *repository.User) *model.UserResponse {
	return &model.UserResponse{
		ID:            u.ID,
		Name:          u.Name,
		Email:         u.Email,
		EmailVerified: u.EmailVerified,
		Image:         u.Image,
		Role:          u.Role,
		CreatedAt:     u.CreatedAt,
		UpdatedAt:     u.UpdatedAt,
	}
}
