package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/green-algeria-map/backend-go/internal/server"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	storeType := os.Getenv("STORE_TYPE")
	dsn := os.Getenv("DATABASE_URL")

	cfg := server.Config{StoreType: storeType}

	if storeType == "postgres" && dsn != "" {
		pool, err := pgxpool.New(context.Background(), dsn)
		if err != nil {
			log.Fatalf("failed to connect to postgres: %v", err)
		}
		defer pool.Close()
		cfg.Pool = pool
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := server.New(cfg)
	log.Printf("starting server on :%s (store=%s)", port, storeType)
	if err := http.ListenAndServe(":"+port, srv.Router); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
