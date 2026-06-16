package server

import (
	"context"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/green-algeria-map/backend-go/internal/auth"
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
	StoreType   string
	Pool        *pgxpool.Pool
	DatabaseURL string
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
	var zoneRepo service.ZoneRepository
	var damageRepo service.DamageReportRepository

	if cfg.StoreType == "postgres" && cfg.Pool != nil {
		pg := repository.NewPostgresStore(cfg.Pool)
		itemRepo = pg
		zoneRepo = pg
		damageRepo = pg
	} else {
		itemRepo = store
		zoneRepo = store
		damageRepo = store
	}

	crudSvc := service.NewCRUDService(itemRepo)
	zoneSvc := service.NewZoneService(zoneRepo)
	seedZones(context.Background(), zoneRepo)
	damageSvc := service.NewDamageReportService(damageRepo)

	crudH := handler.NewCRUDHandler(crudSvc)
	zoneH := handler.NewZoneHandler(zoneSvc)
	damageH := handler.NewDamageReportHandler(damageSvc)
	publicH := handler.NewPublicHandler(zoneSvc, damageSvc)
	storageH := handler.NewStorageHandler(zoneSvc)

	// go-better-auth for email/password auth
	if cfg.Pool != nil {
		authHandler := auth.New(cfg.DatabaseURL)
		r.Handle("/api/auth/*", authHandler.Handler())
	}

	// Match Spring Boot: health at root
	r.Get("/healthz", handler.Live)
	r.Get("/readyz", handler.Ready)
	r.Handle("/uploads/*", http.StripPrefix("/uploads/", http.FileServer(http.Dir("uploads"))))

	r.Route("/api", func(r chi.Router) {
		r.Get("/ping", handler.Ping)
		r.Post("/echo", handler.Echo)
		r.Post("/validate", handler.Validate)

		r.Route("/public", func(r chi.Router) {
			r.Get("/map", publicH.MapData)
		})

		// Storage (matching NestJS/Spring Boot routes)
		r.Post("/storage/zones/{id}/photo", storageH.UploadZonePhoto)

		// Zones
		r.Route("/zones", func(r chi.Router) {
			r.Get("/", zoneH.List)
			r.Post("/", zoneH.Create)
			r.Get("/{id}", zoneH.GetByID)
			r.Put("/{id}", zoneH.Update)
			r.Post("/{id}/volunteer", zoneH.RegisterVolunteer)
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
	CreateZone(ctx context.Context, name, zoneType, status string, lat, lng float64, targetCount, currentCount *int, description, treeSpecies, organizerContact string, volunteerCount int, photos []string) (*repository.ZoneEntity, error)
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
		name             string
		zoneType         string
		status           string
		lat              float64
		lng              float64
		targetCount      *int
		currentCount     *int
		description      string
		treeSpecies      string
		organizerContact string
	}

	ptr := func(v int) *int { return &v }

	zones := []seedZone{
		{"Chrea National Park", "planting", "in-progress", 36.4424, 2.8695, ptr(5000), ptr(1200), "Reforestation of cedar forests destroyed by wildfires.", "Cedrus atlantica", "Fatima Ouali — fatima.ouali@greenalgeria.dz"},
		{"Tlemcen National Park", "planting", "planned", 34.8386, -1.2939, ptr(3000), ptr(0), "Restoring Mediterranean pine and oak ecosystems.", "Pinus halepensis", ""},
		{"El Kala National Park", "planting", "completed", 36.8794, 8.4389, ptr(8000), ptr(8000), "Completed cork oak and wetland reforestation.", "Quercus suber", ""},
		{"Bejaia Coast Cleanup", "trash", "in-progress", 36.7509, 5.0859, nil, nil, "Beach and coastal trash collection point.", "", "Karim Bensaid — karim.bensaid@greenalgeria.dz"},
		{"Oran Bay Cleanup", "trash", "planned", 35.7043, -0.6401, nil, nil, "Organized cleanup of Oran coastline.", "", ""},
		{"Djurdjura Cleanup", "cleanup", "in-progress", 36.4333, 4.25, nil, nil, "Mountain trail cleanup and maintenance.", "", ""},
		{"Hoggar Mountains Planting", "planting", "planned", 23.2872, 5.6358, ptr(2000), ptr(0), "Acacia and drought-resistant tree planting in the Sahara.", "Acacia tortilis", ""},
		{"Mila Olive Grove", "planting", "in-progress", 36.4514, 6.2644, ptr(1500), ptr(600), "Community olive tree planting project.", "Olea europaea", ""},
		{"Annaba Dunes Cleanup", "trash", "completed", 36.9139, 7.7639, nil, nil, "Completed dune and beach cleanup operation.", "", ""},
		{"Tizi Ouzou Reforestation", "planting", "in-progress", 36.7167, 4.05, ptr(4000), ptr(1500), "Mixed oak and pine reforestation in Kabylie region.", "Quercus suber", "Said Amrani — said.amrani@greenalgeria.dz"},
	}

	log.Printf("seed: inserting %d demo zones...", len(zones))
	for _, z := range zones {
		_, err := repo.CreateZone(ctx, z.name, z.zoneType, z.status, z.lat, z.lng, z.targetCount, z.currentCount, z.description, z.treeSpecies, z.organizerContact, 0, nil)
		if err != nil {
			log.Printf("seed: failed to create zone %q: %v", z.name, err)
		}
	}
	log.Printf("seed: done")
}
