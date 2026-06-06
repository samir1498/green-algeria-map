package server

import (
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

	r.Use(chimw.RealIP)
	r.Use(chimw.Recoverer)
	r.Use(chimw.NoCache)

	store := repository.NewInMemoryStore()

	var itemRepo service.ItemRepository
	var authRepo service.AuthRepository

	if cfg.StoreType == "postgres" && cfg.Pool != nil {
		pg := repository.NewPostgresStore(cfg.Pool)
		itemRepo = pg
		authRepo = pg
	} else {
		itemRepo = store
		authRepo = store
	}

	authSvc := service.NewAuthService(authRepo)
	crudSvc := service.NewCRUDService(itemRepo)

	authH := handler.NewAuthHandler(authSvc)
	crudH := handler.NewCRUDHandler(crudSvc)

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

		// Auth (matching Spring Boot routes exactly)
		r.Post("/auth/sign-up/email", authH.SignUp)
		r.Post("/auth/sign-in/email", authH.SignIn)
		r.Get("/auth/get-session", authH.GetSession)
		r.Post("/auth/sign-out", authH.SignOut)

		// Zones (stub matching Spring Boot public GET/POST)
		r.Route("/zones", func(r chi.Router) {
			r.Get("/", handler.Ping)
			r.Post("/", handler.Ping)
			r.Get("/{id}", handler.Ping)
		})

		// Damage reports (stub matching Spring Boot public GET/POST)
		r.Route("/damage-reports", func(r chi.Router) {
			r.Get("/", handler.Ping)
			r.Post("/", handler.Ping)
			r.Get("/{id}", handler.Ping)
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
