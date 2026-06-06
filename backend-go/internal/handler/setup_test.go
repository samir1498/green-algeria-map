package handler

import (
	"testing"

	"github.com/green-algeria-map/backend-go/internal/repository"
	"github.com/green-algeria-map/backend-go/internal/service"
)

func setupCRUDHandler(t *testing.T) *CRUDHandler {
	t.Helper()
	store := repository.NewInMemoryStore()
	svc := service.NewCRUDService(store)
	return NewCRUDHandler(svc)
}
