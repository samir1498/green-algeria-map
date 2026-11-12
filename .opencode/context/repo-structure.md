<!-- Context: main -->
# repo-structure

Last updated: 2026-11-12 (polyglot split)

## Role

This is the **product** repo (main GAM): NestJS backend + `frontend/` submodule.
The Spring Boot and Go implementations, the benchmark harness and the frontend UI
source moved to their own repositories. Never edit `frontend/` contents here —
gitlink only.

## Tech stack

| Layer | Tech |
|------|------|
| Frontend | React 19, TanStack Router/Query, Tailwind v4, shadcn/ui, Leaflet (submodule → `gam-frontend`) |
| Backend | NestJS 11, CQRS, TypeORM, PostgreSQL 18 |
| Auth | better-auth (`@thallesp/nestjs-better-auth`) |
| Object storage | RustFS (S3-compatible), SigV4 |
| CI | GitHub Actions — nestjs + e2e |
| CD | Cloudflare Pages |

## Directory layout

```
green-algeria-map/
├── frontend/            # git submodule -> samir1498/gam-frontend
├── backend-nestjs/      # NestJS CQRS API
├── config/              # compose dev/e2e, .tmux.conf
├── scripts/dev/         # start.sh, setup.sh
├── docs/adr/
└── docker-compose.yml   # postgres + rustfs + app
```

## Build / test

```bash
git submodule update --init --recursive
cd backend-nestjs && pnpm test
cd frontend && pnpm check
```

## Related repos

`gam-frontend` (UI), `gam-backend-springboot`, `gam-backend-go`, `gam-contract`,
`gam-benchmark`, `gam-platform`, `gam-laravel`.
