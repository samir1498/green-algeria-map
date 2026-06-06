# Green Algeria Map

Map-based platform for tracking reforestation and cleanup efforts across Algeria. Volunteers, donors, and organizers can find planting zones, track progress, and coordinate action.

## Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 19, TanStack Router, Tailwind CSS v4, shadcn/ui, Leaflet |
| **Backend (NestJS)** | NestJS 11, CQRS (`@nestjs/cqrs`), TypeORM, PostgreSQL 18 |
| **Backend (Spring Boot)** | Spring Boot 4.0.6, Java 25, CQRS, JPA/Hibernate, Flyway, PostgreSQL 18 |
| **Auth (NestJS)** | BetterAuth + `@thallesp/nestjs-better-auth` |
| **Auth (Spring Boot)** | Form login, BCrypt, session-based |
| **Quality** | TypeScript strict, ESLint, Prettier, knip, depcruise, husky |
| **CI** | GitHub Actions — frontend + backend (NestJS + Spring Boot) with path filters |
| **CD** | Cloudflare Pages (frontend on `main` push) + GHCR (Spring Boot native Docker image on annotated tag `backend-springboot-v*`) |
| **E2E** | Playwright tests against NestJS & Spring Boot backends (manual trigger) |
| **Runtime** | Docker (PostgreSQL), pnpm, Bun |

## Quick Start

```bash
# Start everything (DB → migrations → seed → services in tmux)
./start-dev.sh

# Or manually:
cd backend-nestjs && docker compose up -d db
pnpm migration:run
bun src/seed.ts
pnpm start:dev

cd frontend && pnpm dev
```

## Architecture

### Clean Architecture Layers

```mermaid
graph LR
    C[Controller] --> CB[CommandBus]
    C --> QB[QueryBus]
    CB --> CH[Command Handlers]
    QB --> QH[Query Handlers]
    CH --> RI[ZoneRepository Interface]
    QH --> RI
    RI --> RImpl[ZoneRepositoryImpl]
    RImpl --> TO[TypeORM]
    RI -. depends .-> D[Domain Entity]
    RImpl -. maps .-> D
```

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | Controllers, DTOs, auth decorators | `zones.controller.ts`, `dto/` |
| **Application** | Commands, queries, event handlers | `application/{commands,queries,events}/` |
| **Domain** | Entities, value objects, repository interfaces | `domain/` |
| **Infrastructure** | TypeORM entities, mappers, repository impls | `infrastructure/` |

### CQRS Flow

```mermaid
sequenceDiagram
    participant C as Controller
    participant CB as CommandBus
    participant QB as QueryBus
    participant CH as Command Handler
    participant QH as Query Handler
    participant R as ZoneRepository
    participant DB as PostgreSQL

    C->>QB: GetAllZonesQuery
    QB->>QH: execute()
    QH->>R: findAll()
    R->>DB: SELECT
    DB-->>R: rows
    R-->>QH: Zone[]
    QH-->>QB: Zone[]
    QB-->>C: Zone[]

    C->>CB: CreateZoneCommand
    CB->>CH: execute()
    CH->>R: save(zone)
    R->>DB: INSERT
    R-->>CH: Zone
    CH-->>CB: Zone
    CB-->>C: Zone
    Note over R: publishes ZoneCreatedEvent
```

- Zone GET routes are `@AllowAnonymous()` (public), writes require auth

## Frontend Scripts

Run from `frontend/`:

| Command | Description |
|---------|-------------|
| `pnpm dev` | Dev server (port 3000) |
| `pnpm build` | Production build |
| `pnpm check` | Type check |
| `pnpm lint` | ESLint |
| `pnpm knip` | Dead code detection |
| `pnpm depcruise` | Module boundary validation |
| `pnpm format` | Prettier |

## Backend Scripts

### NestJS

Run from `backend-nestjs/`:

| Command | Description |
|---------|-------------|
| `pnpm start:dev` | Dev server (port 8080, watch mode) |
| `pnpm build` | Compile to dist/ |
| `pnpm check` | Type check |
| `pnpm lint` | ESLint |
| `pnpm knip` | Dead code detection |
| `pnpm depcruise` | Circular dependency detection |
| `pnpm test` | Vitest unit tests |
| `pnpm test:it` | Integration tests (Testcontainers + PostgreSQL) |
| `pnpm migration:generate` | Generate migration from entity changes |
| `pnpm migration:run` | Apply pending migrations |
| `pnpm migration:revert` | Revert last migration |
| `bun src/seed.ts` | Seed demo data (10 zones) |

API docs at `http://localhost:8080/api/docs` (Scalar, moon theme).

### Spring Boot

Run from `backend-springboot/`:

| Command | Description |
|---------|-------------|
| `make dev` | Dev server (port 8080) |
| `make build` | Build JAR (skip tests) |
| `make check` | Test + lint |
| `make lint` | Format check (Palantir) |
| `make format` | Auto-format |
| `make test-unit` | Domain unit tests |
| `make test-arch` | Architecture tests (ArchUnit) |
| `make test-it` | Integration tests (Testcontainers + PostgreSQL) |
| `make native` | Native compile (GraalVM binary) |
| `make native-image` | Build native Docker image |
| `make depgraph` | Generate module dependency graph |

API docs at `http://localhost:8080/swagger-ui/index.html` (Swagger UI).

### Auth Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/sign-up/email` | Register with email + password |
| POST | `/api/auth/sign-in/email` | Sign in, returns session cookie |
| GET | `/api/auth/get-session` | Get current session |
| POST | `/api/auth/sign-out` | Sign out |

## Project Structure

```
green-algeria-map/
├── frontend/                 # React SPA
│   └── src/
│       ├── app/              # App shell (router.tsx)
│       ├── features/         # Domain feature slices
│       │   ├── auth/         #   api/ + hooks/
│       │   ├── zones/        #   api/ + hooks/
│       │   ├── damage-reports/ # api/ + hooks/ + components/
│       │   ├── map/          #   components/ (Map, Legend)
│       │   └── tree-info/    #   api/ + hooks/ + components/
│       ├── routes/           # TanStack Router route files (thin)
│       ├── shared/           # Cross-cutting shared code
│       │   ├── components/   #   shadcn/ui primitives
│       │   ├── constants/    #   Domain constants
│       │   ├── demo/         #   Mock data
│       │   ├── hooks/        #   Shared hooks
│       │   ├── lib/          #   Axios, query client, utils
│       │   ├── test/         #   Test utilities
│       │   ├── types/        #   Domain types
│       │   └── utils/        #   Pure utility functions
│       ├── main.tsx
│       ├── routeTree.gen.ts
│       └── styles.css
├── backend-nestjs/           # NestJS CQRS API
│   ├── src/
│   │   ├── lib/              # Shared: DomainError, exception filters
│   │   ├── data-source.ts    # TypeORM DataSource for migrations
│   │   ├── seed.ts           # Demo data seeder
│   │   ├── migrations/       # TypeORM migrations
│   │   └── modules/
│   │       ├── zones/        # domain/ + application/ + infrastructure/ + dto/
│   │       ├── damage-reports/ # domain/ + application/ + infrastructure/ + dto/
│   │       └── auth/         # infrastructure/ only (BetterAuth)
│   └── test/
│       ├── it/               # Integration tests (Testcontainers + Postgres)
│       └── setup/            # Test module helper
├── backend-springboot/       # Spring Boot CQRS API (Testcontainers, Flyway, GraalVM)
│   └── src/main/java/...     # domain/ + application/ + infrastructure/ + controller/
├── benchmark/                # k6 scripts + results for performance benchmarks
├── .github/workflows/        # CI/CD (frontend, NestJS, Spring Boot) + E2E
├── .skills/                  # Project-specific AI skills
├── .husky/                   # Pre-commit hooks
├── CONTEXT.md                # Domain architecture documentation
├── start-dev.sh              # Dev environment launcher
└── .tmux.conf                # Tmux config
```

## CI / CD

| Workflow | Triggers | Jobs |
|----------|----------|------|
| CI Frontend | Changes in `frontend/` or `ci.yml` | check → lint → knip → depcruise → test-unit → test-ui → test-it → coverage → build |
| CI Backend NestJS | Changes in `backend-nestjs/` or `ci-backend.yml` | check → lint → knip → depcruise → test-unit → test-it → build |
| CI Backend Spring Boot | Changes in `backend-springboot/` or `ci-backend-springboot.yml` | check → lint → arch → depgraph → test-unit → test-it → build |
| CD Frontend | Push to `main` (frontend/ or cd.yml) + manual | Build → Deploy to Cloudflare Pages |
| CD Backend Spring Boot | Annotated tag `backend-springboot-v*` + manual | Test → Build native Docker image → Push to GHCR |
| E2E | manual (workflow_dispatch) | Playwright tests against NestJS & Spring Boot |

## Status

### NestJS
- Interactive Leaflet map with 10 demo zones, color-coded by status
- Dark mode, legend, zoom controls, status popups
- NestJS 11 backend with CQRS + TypeORM + PostgreSQL
- BetterAuth email/password authentication
- Zone CRUD API + Scalar docs
- Damage reporting: types, API, red markers, form modal, severity colors, status badges
- Tree species info lookup (iNaturalist autocomplete + species detail + GBIF Algeria observations)
- Tree search input with debounced autocomplete
- TypeORM migration workflow + seed script
- CI split (frontend/backend), depcruise, pre-commit hooks
- Clean architecture: domain/application/infrastructure layers
- Frontend auth integration (sign-in/up pages, protected routes)
- Full test suite: unit, UI, integration

### Spring Boot
- Feature parity with NestJS: 19 API endpoints (zone CRUD, damage reports, auth, public map, health)
- CQRS with CommandBus/QueryBus (SimpleCommandBus, SimpleQueryBus)
- Photo upload: `POST /storage/zones/{id}/photo` with S3-compatible storage (MinIO/RustFS)
- Swagger/OpenAPI at `/swagger-ui/index.html`
- Rich domain model: Coordinates value object, status transitions, domain events
- Repository abstraction: domain interfaces decoupled from JPA
- Zero-mock test suite: 48 integration tests via Testcontainers + singleton PostgreSQL
- Architecture enforcement: 7 ArchUnit rules
- Native Docker image: GraalVM via Paketo Buildpacks, pushed to GHCR on tag (`backend-springboot-v*`)
- Makefile for all dev/build/test commands (no direct `mvnw` usage)
- GitHub Actions CI: compile, lint, arch tests, depgraph, unit tests, integration tests, build

## License

MIT
