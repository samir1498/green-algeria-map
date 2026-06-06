package service

import (
	"context"
	"errors"

	"github.com/green-algeria-map/backend-go/internal/model"
	"github.com/green-algeria-map/backend-go/internal/repository"
)

type ItemRepository interface {
	CreateItem(ctx context.Context, name, description string) (*repository.ItemEntity, error)
	GetItem(ctx context.Context, id string) (*repository.ItemEntity, error)
	ListItems(ctx context.Context) ([]*repository.ItemEntity, error)
	UpdateItem(ctx context.Context, id, name, description string) (*repository.ItemEntity, error)
	DeleteItem(ctx context.Context, id string) error
}

type CRUDService struct {
	repo ItemRepository
}

var ErrItemNotFound = errors.New("item not found")

func NewCRUDService(repo ItemRepository) *CRUDService {
	return &CRUDService{repo: repo}
}

func (s *CRUDService) Create(ctx context.Context, req model.CreateItemRequest) (*model.ItemResponse, error) {
	it, err := s.repo.CreateItem(ctx, req.Name, req.Description)
	if err != nil {
		return nil, err
	}
	return toItemResponse(it), nil
}

func (s *CRUDService) Get(ctx context.Context, id string) (*model.ItemResponse, error) {
	it, err := s.repo.GetItem(ctx, id)
	if err != nil {
		return nil, err
	}
	if it == nil {
		return nil, ErrItemNotFound
	}
	return toItemResponse(it), nil
}

func (s *CRUDService) List(ctx context.Context) (*model.ListItemsResponse, error) {
	items, err := s.repo.ListItems(ctx)
	if err != nil {
		return nil, err
	}
	resp := &model.ListItemsResponse{Items: make([]model.ItemResponse, 0, len(items))}
	for _, it := range items {
		resp.Items = append(resp.Items, *toItemResponse(it))
	}
	return resp, nil
}

func (s *CRUDService) Update(ctx context.Context, id string, req model.UpdateItemRequest) (*model.ItemResponse, error) {
	it, err := s.repo.UpdateItem(ctx, id, req.Name, req.Description)
	if err != nil {
		return nil, err
	}
	if it == nil {
		return nil, ErrItemNotFound
	}
	return toItemResponse(it), nil
}

func (s *CRUDService) Delete(ctx context.Context, id string) error {
	return s.repo.DeleteItem(ctx, id)
}

func toItemResponse(it *repository.ItemEntity) *model.ItemResponse {
	return &model.ItemResponse{
		ID:          it.ID,
		Name:        it.Name,
		Description: it.Description,
		CreatedAt:   it.CreatedAt,
		UpdatedAt:   it.UpdatedAt,
	}
}
