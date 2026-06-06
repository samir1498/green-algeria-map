package model

import "time"

// --- Ping ---
type PingResponse struct {
	Status string `json:"status"`
}

// --- Echo ---
type EchoRequest struct {
	Name     string            `json:"name"     validate:"required"`
	Email    string            `json:"email"    validate:"required,email"`
	Age      int               `json:"age"      validate:"gte=0,lte=150"`
	Address  Address           `json:"address"  validate:"required"`
	Tags     []string          `json:"tags"     validate:"required,min=1"`
	Metadata map[string]any    `json:"metadata" validate:"required"`
}

type Address struct {
	Street string `json:"street" validate:"required"`
	City   string `json:"city"   validate:"required"`
	Zip    string `json:"zip"    validate:"required"`
}

type EchoResponse struct {
	Echo EchoRequest `json:"echo"`
}

// --- Validate ---
type ValidateRequest struct {
	Name     string            `json:"name"     validate:"required"`
	Email    string            `json:"email"    validate:"required,email"`
	Age      int               `json:"age"      validate:"gte=0,lte=150"`
	Address  Address           `json:"address"  validate:"required"`
	Tags     []string          `json:"tags"     validate:"required,min=1"`
	Metadata map[string]any    `json:"metadata" validate:"required"`
}

type ValidateResponse struct {
	Valid bool `json:"valid"`
}

// --- Auth (matching Spring Boot) ---
type SignUpRequest struct {
	Email    string `json:"email"    validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
	Name     string `json:"name"     validate:"required"`
}

type LoginRequest struct {
	Email    string `json:"email"    validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type UserResponse struct {
	ID            string     `json:"id"`
	Name          string     `json:"name"`
	Email         string     `json:"email"`
	EmailVerified bool       `json:"emailVerified"`
	Image         *string    `json:"image"`
	Role          string     `json:"role"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
}

type AuthResponse struct {
	User *UserResponse `json:"user"`
}

type SessionResponse struct {
	User *UserResponse `json:"user"`
}

type SignOutResponse struct {
	Success bool `json:"success"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

// --- Items (CRUD) ---
type CreateItemRequest struct {
	Name        string `json:"name"        validate:"required"`
	Description string `json:"description" validate:"max=1000"`
}

type UpdateItemRequest struct {
	Name        string `json:"name"        validate:"required"`
	Description string `json:"description" validate:"max=1000"`
}

type ItemResponse struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type ListItemsResponse struct {
	Items []ItemResponse `json:"items"`
}
