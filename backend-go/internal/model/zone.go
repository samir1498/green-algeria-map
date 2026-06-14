package model

import "time"

// --- Zones ---
type CreateZoneRequest struct {
	Name        string   `json:"name"        validate:"required"`
	Type        string   `json:"type"        validate:"required"`
	Status      string   `json:"status"      validate:"required"`
	Lat         float64  `json:"lat"         validate:"required"`
	Lng         float64  `json:"lng"         validate:"required"`
	Description string   `json:"description" validate:"max=2000"`
	Photos      []string `json:"photos"`
}

type UpdateZoneRequest struct {
	Name        string   `json:"name"        validate:"required"`
	Type        string   `json:"type"        validate:"required"`
	Status      string   `json:"status"      validate:"required"`
	Lat         float64  `json:"lat"         validate:"required"`
	Lng         float64  `json:"lng"         validate:"required"`
	Description string   `json:"description" validate:"max=2000"`
	Photos      []string `json:"photos"`
}

type ZoneResponse struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Type        string    `json:"type"`
	Status      string    `json:"status"`
	Lat         float64   `json:"lat"`
	Lng         float64   `json:"lng"`
	Description string    `json:"description"`
	Photos      []string  `json:"photos"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type ListZonesResponse struct {
	Zones []ZoneResponse `json:"zones"`
}

// --- Damage Reports ---
type CreateDamageReportRequest struct {
	ZoneID      string  `json:"zoneId"      validate:"required,uuid"`
	Title       string  `json:"title"       validate:"required"`
	Description string  `json:"description" validate:"max=2000"`
	Severity    string  `json:"severity"    validate:"required"`
	Lat         float64 `json:"lat"         validate:"required"`
	Lng         float64 `json:"lng"         validate:"required"`
}

type DamageReportResponse struct {
	ID          string    `json:"id"`
	ZoneID      *string   `json:"zoneId"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Severity    string    `json:"severity"`
	Lat         float64   `json:"lat"`
	Lng         float64   `json:"lng"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type ListDamageReportsResponse struct {
	Reports []DamageReportResponse `json:"reports"`
}
