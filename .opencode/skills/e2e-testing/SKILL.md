---
name: e2e-testing
description: Use when working on Playwright e2e tests, e2e configs, or the e2e CI pipeline. Covers docker compose, ports, startup scripts, env vars, auth setup, and backend-specific configs.
---

# E2E Testing — green-algeria-map

## Infrastructure

Shared services defined in `config/docker-compose.e2e.yml`:

| Service   | Container             | Port | Health check                                          |
|-----------|-----------------------|------|-------------------------------------------------------|
| postgres  | green-algeria-e2e-db  | 5432 | `pg_isready -U greenalgeria -d greenalgeria`          |
| rustfs    | green-algeria-e2e-rustfs | 9000 | `wget -q --spider http://127.0.0.1:9000/`          |

## Backend Ports

| Backend     | Port | Health URL                    | API Prefix |
|-------------|------|-------------------------------|------------|
| NestJS      | 8080 | `/api/health/live`            | `""`       |
| Spring Boot | 8081 | `/healthz` / `/readyz`        | `/api`     |
| Go          | 8082 | `/healthz` / `/readyz`        | `/api`     |

## Run Commands

```bash
# From frontend/
pnpm test:e2e                 # NestJS (default config)
pnpm test:e2e:spring          # Spring Boot backend
pnpm test:e2e:go              # Go backend
pnpm test:e2e:prod            # Production URLs
```

## Config Files

- `frontend/config/playwright.config.ts` — NestJS (default)
- `frontend/config/playwright.spring.config.ts` — Spring Boot, sets `webServer` to `scripts/e2e-start.sh` in `backend-springboot`
- `frontend/config/playwright.go.config.ts` — Go, sets `webServer` to `scripts/e2e-start.sh` in `backend-go` with `DISABLE_RATE_LIMIT=true`

## Key Env Vars

| Variable         | Purpose                           |
|------------------|-----------------------------------|
| `VITE_API_URL`   | Backend URL for frontend build    |
| `VITE_API_BACKEND` | `spring` or unset (nest/go)    |
| `E2E_AUTH_BASE`  | Auth endpoint for e2e setup       |
| `DISABLE_RATE_LIMIT` | Disable rate limiting in Go   |
| `CI`             | Enables retries (2) in Playwright |

## Auth

Auth setup is done via `e2e/auth.setup.ts` which authenticates and stores storage state to `playwright/.auth/user.json`. The `E2E_AUTH_BASE` env var points to the correct auth URL for each backend.

## CI Pipeline

See `.github/workflows/ci-e2e.yml` — three jobs:
- `e2e-nestjs`: uses GitHub Actions `services` for postgres
- `e2e-springboot`: uses `services` for postgres, builds with Maven
- `e2e-go`: builds Go binary, no external services needed
