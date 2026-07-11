package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strconv"

	_ "github.com/green-algeria-map/backend-go/docs"
	"github.com/green-algeria-map/backend-go/internal/server"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	httpSwagger "github.com/swaggo/http-swagger"
)

func main() {
	_ = godotenv.Load()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}

	poolConfig, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		log.Fatalf("failed to parse postgres config: %v", err)
	}
	if maxConns := os.Getenv("DB_POOL_MAX"); maxConns != "" {
		if n, err := strconv.Atoi(maxConns); err == nil && n > 0 {
			poolConfig.MaxConns = int32(n)
			log.Printf("db pool: MaxConns set to %d", n)
		}
	}
	poolConfig.ConnConfig.RuntimeParams["search_path"] = "go_backend,public,extensions"
	pool, err := pgxpool.NewWithConfig(context.Background(), poolConfig)
	if err != nil {
		log.Fatalf("failed to connect to postgres: %v", err)
	}
	defer pool.Close()

	config := server.Config{StoreType: "postgres", Pool: pool}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	httpServer := server.New(config)

	// Swagger docs
	http.Handle("/swagger/", httpSwagger.WrapHandler)

	log.Printf("starting server on :%s", port)
	if err := http.ListenAndServe(":"+port, httpServer.Router); err != nil {
		log.Fatalf("server error: %v", err)
	}
}