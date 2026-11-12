---
name: deployment
description: Use when working on CI/CD workflows, docker compose, or deployment config. Product repo only; other GAM backends deploy from their own repos.
---

# Deployment — green-algeria-map (product)

## Scope in this repo

```
./backend-nestjs/       # NestJS API
./frontend/             # submodule -> gam-frontend (UI source lives there)
./docker-compose.yml    # postgres + rustfs + app
.github/workflows/      # ci-backend.yml, cd.yml, ci-e2e.yml, ci-gate.yml
```

## CI Workflows

| Workflow | File | Trigger |
|----------|------|---------|
| CI Backend NestJS | `ci-backend.yml` | `backend-nestjs/**` |
| CD Frontend | `cd.yml` | push to main (`frontend/**`), manual |
| E2E | `ci-e2e.yml` | workflow_dispatch |
| CI Gate | `ci-gate.yml` | PRs |

## Docker

- `docker-compose.yml` — infra + NestJS app (no other backends).
- Spring Boot and Go images: `ghcr.io/samir1498/gam-backend-springboot`, `ghcr.io/samir1498/gam-backend-go` (built by those repos).
- Frontend image: `gam-frontend/Dockerfile`, consumed by stack repos and k8s.

## Submodule rules

Every checkout that needs the UI must set `submodules: recursive`. The frontend is
bumped by pointer, never edited here.

## CD Frontend

`cd.yml` builds `frontend/` (with submodule) and deploys to Cloudflare Pages,
project `green-algeria-map`.
