# Green Algeria Map — Agent Guide

## Purpose
Map-based platform for Green Algeria association. Volunteers, donors, and organizers track reforestation and cleanup efforts across Algeria.

## Core Domain Concepts
- **Zone** — geographic area for planting/cleanup. Types: `planting`, `trash`, `cleanup`. Status: `planned`, `in-progress`, `completed`.
- **Damage Report** — report of illegal dumping, tree vandalism, encroachment. Status: `reported` → `verified` → `resolved`. Severity: `low`, `medium`, `high`, `critical`.
- **Tree Species** — fetched live from iNaturalist (autocomplete + detail) and GBIF (Algeria observation counts).
- **User/Auth** — email/password via BetterAuth.

## Frontend Architecture
Feature-sliced: `features/{domain}/{api,hooks,components}/`
```
api/  →  hooks/  →  components/  |  routes/
(data)   (query)      (UI)        |  (page shells)
```
- `api/` — raw data fetching/mutation
- `hooks/` — TanStack Query wrappers
- `components/` — consume hooks
- `routes/` — thin page shells

## Backend Architecture
DDD-lite: `domain/` → `application/` → `infrastructure/`
- `domain/` — pure TS entities, interfaces, errors
- `application/` — CQRS handlers
- `infrastructure/` — TypeORM, mappers

## Key Decisions
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Map | Leaflet + react-leaflet | Lightweight, no API key |
| Species | iNaturalist + GBIF (frontend-only) | Free, no backend needed |
| State | TanStack Query | Server cache, dedup |
| Auth | BetterAuth + nestjs-better-auth | Self-hosted, sessions |
| Backend | CQRS via @nestjs/cqrs | Read/write separation |
| Quality | tsc strict + ESLint + knip + depcruise | Catch dead code, circular deps |

## PR Rules
- **No mixing frontend and backend** in the same PR. A PR touches either `frontend/` or `backend-nestjs/`, never both. The rare exception is when a backend change exists purely to support the frontend change (e.g., adding `@Public()` to an endpoint) — even then, submit as two stacked PRs: backend first, then frontend rebased on top.

## Module Boundaries (enforced by depcruise)
### Frontend
- `api/` → must NOT import hooks, components, or routes
- `components/` → must NOT import api/ directly
- `routes/` → must NOT import api/ directly (auth exempt)
- `hooks/` → must NOT import from components/

### Backend
- `domain/` → must NOT import application, infrastructure, or dto
- `infrastructure/` → must NOT import application
