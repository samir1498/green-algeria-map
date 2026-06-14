package server

import (
	"context"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/green-algeria-map/backend-go/internal/handler"
	"github.com/green-algeria-map/backend-go/internal/middleware"
	"github.com/green-algeria-map/backend-go/internal/repository"
	"github.com/green-algeria-map/backend-go/internal/service"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Server struct {
	Router http.Handler
}

type Config struct {
	StoreType string
	Pool      *pgxpool.Pool
}

func New(cfg Config) *Server {
	r := chi.NewRouter()

	r.Use(middleware.CORS)
	r.Use(chimw.RealIP)
	r.Use(chimw.Recoverer)
	r.Use(chimw.NoCache)
	r.Use(chimw.Compress(5, "application/json"))
	r.Use(middleware.RateLimit)

	store := repository.NewInMemoryStore()

	var itemRepo service.ItemRepository
	var authRepo service.AuthRepository
	var zoneRepo service.ZoneRepository
	var damageRepo service.DamageReportRepository

	if cfg.StoreType == "postgres" && cfg.Pool != nil {
		pg := repository.NewPostgresStore(cfg.Pool)
		itemRepo = pg
		authRepo = pg
		zoneRepo = pg
		damageRepo = pg
	} else {
		itemRepo = store
		authRepo = store
		zoneRepo = store
		damageRepo = store
	}

	authSvc := service.NewAuthService(authRepo)
	crudSvc := service.NewCRUDService(itemRepo)
	zoneSvc := service.NewZoneService(zoneRepo)
	if cfg.Pool != nil {
		seedZones(context.Background(), zoneRepo)
	}
	damageSvc := service.NewDamageReportService(damageRepo)

	authH := handler.NewAuthHandler(authSvc)
	crudH := handler.NewCRUDHandler(crudSvc)
	zoneH := handler.NewZoneHandler(zoneSvc)
	damageH := handler.NewDamageReportHandler(damageSvc)

	// Match Spring Boot: health at root
	r.Get("/healthz", handler.Live)
	r.Get("/readyz", handler.Ready)

	r.Route("/api", func(r chi.Router) {
		r.Use(middleware.WithSession)

		r.Get("/ping", handler.Ping)
		r.Post("/echo", handler.Echo)
		r.Post("/validate", handler.Validate)

		// Public endpoints (permitAll in Spring Boot)
		r.Route("/public", func(r chi.Router) {
			r.Get("/map", handler.Ping)
		})

		// Auth (matching NestJS/Spring Boot routes exactly)
		r.Post("/auth/sign-up/email", authH.SignUp)
		r.Post("/auth/sign-in/email", authH.SignIn)
		r.Get("/auth/get-session", authH.GetSession)
		r.Post("/auth/sign-out", authH.SignOut)

		// Zones
		r.Route("/zones", func(r chi.Router) {
			r.Get("/", zoneH.List)
			r.Post("/", zoneH.Create)
			r.Get("/{id}", zoneH.GetByID)
			r.Put("/{id}", zoneH.Update)
			r.Delete("/{id}", zoneH.Delete)
		})

		// Damage reports
		r.Route("/damage-reports", func(r chi.Router) {
			r.Get("/", damageH.List)
			r.Post("/", damageH.Create)
			r.Get("/{id}", damageH.GetByID)
		})

		// Items CRUD
		r.Route("/items", func(r chi.Router) {
			r.Get("/", crudH.List)
			r.Post("/", crudH.Create)
			r.Get("/{id}", crudH.GetByID)
			r.Put("/{id}", crudH.Update)
			r.Delete("/{id}", crudH.Delete)
		})
	})

	return &Server{Router: r}
}

type zoneSeeder interface {
	ListZones(ctx context.Context) ([]*repository.ZoneEntity, error)
	CreateZone(ctx context.Context, name, zoneType, status string, lat, lng float64, description string, photos []string) (*repository.ZoneEntity, error)
}

func seedZones(ctx context.Context, repo zoneSeeder) {
	existing, err := repo.ListZones(ctx)
	if err != nil {
		log.Printf("seed: failed to check existing zones: %v", err)
		return
	}
	if len(existing) > 0 {
		log.Printf("seed: zones already exist (%d), skipping", len(existing))
		return
	}

	type seedZone struct {
		name        string
		zoneType    string
		status      string
		lat         float64
		lng         float64
		description string
	}

	zones := []seedZone{
		{"Chrea National Park", "planting", "in-progress", 36.4424, 2.8695, "Reforestation of cedar forests destroyed by wildfires."},
		{"Tlemcen National Park", "planting", "planned", 34.8386, -1.2939, "Restoring Mediterranean pine and oak ecosystems."},
		{"El Kala National Park", "planting", "completed", 36.8794, 8.4389, "Completed cork oak and wetland reforestation."},
		{"Bejaia Coast Cleanup", "trash", "in-progress", 36.7509, 5.0859, "Beach and coastal trash collection point."},
		{"Oran Bay Cleanup", "trash", "planned", 35.7043, -0.6401, "Organized cleanup of Oran coastline."},
		{"Djurdjura Cleanup", "cleanup", "in-progress", 36.4333, 4.25, "Mountain trail cleanup and maintenance."},
		{"Hoggar Mountains Planting", "planting", "planned", 23.2872, 5.6358, "Acacia and drought-resistant tree planting in the Sahara."},
		{"Mila Olive Grove", "planting", "in-progress", 36.4514, 6.2644, "Community olive tree planting project."},
		{"Annaba Dunes Cleanup", "trash", "completed", 36.9139, 7.7639, "Completed dune and beach cleanup operation."},
		{"Tizi Ouzou Reforestation", "planting", "in-progress", 36.7167, 4.05, "Mixed oak and pine reforestation in Kabylie region."},
	}

	log.Printf("seed: inserting %d demo zones...", len(zones))
	for _, z := range zones {
		_, err := repo.CreateZone(ctx, z.name, z.zoneType, z.status, z.lat, z.lng, z.description, nil)
		if err != nil {
			log.Printf("seed: failed to create zone %q: %v", z.name, err)
		}
	}
	log.Printf("seed: done")
}
