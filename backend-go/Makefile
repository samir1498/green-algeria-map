.PHONY: build run test test-unit test-it clean docker-build fmt vet tidy

BIN=backend-go
MAIN=./cmd/api

build:
	go build -ldflags="-s -w" -o $(BIN) $(MAIN)

run:
	go run $(MAIN)

test:
	go test ./... -v -count=1

test-unit:
	go test ./internal/... -v -count=1 -short

test-it:
	go test ./internal/repository/... -v -count=1 -run Integration

clean:
	rm -f $(BIN)
	rm -f coverage.out

docker-build:
	docker build -t $(BIN):latest .

fmt:
	go fmt ./...

check: fmt vet
	@echo "check passed"

vet:
	go vet ./...

tidy:
	go mod tidy

migrate-up:
	goose -dir migrations postgres "$(DATABASE_URL)" up

migrate-down:
	goose -dir migrations postgres "$(DATABASE_URL)" down

migrate-reset:
	goose -dir migrations postgres "$(DATABASE_URL)" reset
