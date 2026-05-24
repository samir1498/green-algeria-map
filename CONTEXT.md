# Green Algeria Map — Domain Context

## Purpose

Map-based platform for Green Algeria association. Volunteers, donors, and organizers track reforestation and cleanup efforts across Algeria. Replaces scattered video updates with a real platform.

## Core Domain Concepts

| Term | Meaning |
|------|---------|
| **Zone** | A geographic area where planting or cleanup occurs. Has type (`planting`, `trash`, `cleanup`), status (`planned`, `in-progress`, `completed`), and progress tracking. |
| **Damage Report** | A report of illegal dumping, tree vandalism, or encroachment. Status lifecycle: `reported` → `verified` → `resolved`. Severity levels: `low`, `medium`, `high`, `critical`. |
| **Tree Species** | Tree types associated with planting zones. Fetched live from iNaturalist (autocomplete + species detail) and GBIF (Algeria observation counts). |
| **User / Auth** | Email/password auth via BetterAuth. Volunteers sign up, organizers manage zones. |

## Frontend Architecture

Feature-sliced: `features/{domain}/{api,hooks,components}/`

```
api/        →   hooks/        →   components/   |   routes/
(data)          (query hook)      (UI)           |   (page shells)
```

- `api/` is the bottom layer — raw data fetching/mutation functions
- `hooks/` wraps `api/` with TanStack Query (useQuery, useMutation, staleTime, gcTime)
- `components/` consume hooks — no direct api/ imports
- `routes/` are thin page shells delegating to hooks/components

## Backend Architecture

DDD-lite / Clean Architecture: `domain/` → `application/` → `infrastructure/`

- `domain/` — pure TypeScript: entity, value objects, repository interface, domain errors
- `application/` — CQRS: commands, queries, events each in their own handler directory
- `infrastructure/` — TypeORM entity, mapper, repository implementation

Framework leaks are forbidden in `domain/`. Controllers are thin (route delegation only).

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Map provider | Leaflet via react-leaflet | Lightweight, no API key, free |
| Species data | iNaturalist + GBIF (frontend-only, no key) | Free, no backend needed, covers Algeria |
| State management | TanStack Query (no Redux/Zustand) | Server state cache, dedup, stale-time |
| Auth | BetterAuth + nestjs-better-auth | Self-hosted, email/password, session cookies |
| Backend pattern | CQRS via @nestjs/cqrs | Clear read/write separation, domain events |
| Database | PostgreSQL 18 via Docker | TypeORM, migration workflow |
| Quality | tsc strict + ESLint + knip + depcruise | Catch dead code, circular deps, layer violations |

## Module Boundaries (enforced by dependency-cruiser)

### Frontend
- `api/` → must NOT import hooks, components, or routes
- `components/` → must NOT import api/ directly
- `routes/` → must NOT import api/ directly (auth is exempt)
- `hooks/` → must NOT import from components/

### Backend
- `domain/` → must NOT import application, infrastructure, or dto
- `infrastructure/` → must NOT import application
