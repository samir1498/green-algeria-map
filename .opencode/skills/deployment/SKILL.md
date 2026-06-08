---
name: deployment
description: Use when working on CI/CD workflows, docker compose, or deployment config. Covers CI pipelines, CD workflows, Docker setup, and infrastructure.
---

# Deployment — green-algeria-map

## Repository Structure

```
green-algeria-map/
├── backend-nestjs/       # NestJS (TypeScript) backend
├── backend-springboot/   # Spring Boot (Java) backend
├── backend-go/           # Go backend
├── frontend/             # React/TypeScript frontend (Vite)
├── benchmark/            # Benchmark CLI (Node.js)
├── config/               # Shared config files
├── scripts/              # Utility scripts
├── .github/workflows/    # CI/CD pipelines
└── docker-compose.yml    # Shared infra
```

## CI Workflows

| Workflow | File | Trigger |
|----------|------|---------|
| CI | `.github/workflows/ci.yml` | PRs to main |
| CI Backend NestJS | `ci-backend.yml` | PRs |
| CI Backend Spring Boot | `ci-backend-springboot.yml` | PRs |
| CI Backend Go | `ci-backend-go.yml` | PRs |
| CI E2E | `ci-e2e.yml` | workflow_dispatch, manual |
| CI Bench | `ci-bench.yml` | workflow_dispatch |
| CI Gate | `ci-gate.yml` | PRs (merge gate) |
| CD | `cd.yml` | Push to main |
| CD Spring Boot | `cd-backend-springboot.yml` | Push to main |
| CD Go | `cd-backend-go.yml` | Push to main |

## Docker Compose

Three compose files:
- `docker-compose.yml` — shared postgres + rustfs (used in dev)
- `config/docker-compose.e2e.yml` — e2e postgres + rustfs
- `docker-compose.dev.yml` — dev overrides

Shared infrastructure containers:
- `green-algeria-db` — postgres on 5432
- `green-algeria-rustfs` — object storage on 9000

## CI E2E Jobs

See `.github/workflows/ci-e2e.yml`:
- Each job uses GitHub Actions `services` for postgres (and rustfs for NestJS)
- Backend-specific build steps, env vars, and test commands
- Playwright reports uploaded as artifacts on failure

## Environment Variables

| Variable | Used By | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | Frontend build | Backend URL at build time |
| `VITE_API_BACKEND` | Frontend build | `spring` for Spring Boot features |
| `OO_OBJECT_STORAGE_*` | Backend | RustFS/S3 connection |

## CD Pipeline

Deployments happen on push to main. Each backend has its own CD workflow plus a shared `cd.yml` for the frontend.
