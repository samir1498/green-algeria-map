<!-- Context: main@a933f1c8 -->
# Backend API

Last updated: 2026-06-08

All 3 backends share the same API surface. Differences noted per route.

## Auth

| Method | Path | Auth | NestJS | Spring Boot | Go |
|--------|------|------|--------|-------------|----|
| POST | `/api/auth/sign-up/email` | Public | better-auth | BCrypt + session | BCrypt + session |
| POST | `/api/auth/sign-in/email` | Public | better-auth | AuthManager | BCrypt compare |
| GET | `/api/auth/get-session` | Public | better-auth SDK | Cookie lookup | Cookie lookup |
| POST | `/api/auth/sign-out` | Public | better-auth | Spring Security | Delete session + clear cookie |

Note: NestJS routes are served by better-auth at `/api/auth/...` (not NestJS controllers). All frontends expect this exact path structure.

## Zones

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/zones` | Public | List all, ordered by name ASC |
| GET | `/api/zones/{id}` | Public | UUID param |
| POST | `/api/zones` | Public | Create zone |
| PATCH | `/api/zones/{id}` | Public | Partial update |
| DELETE | `/api/zones/{id}` | Public | Delete |
| POST | `/api/zones/{id}/volunteer` | Public | Increment volunteerCount |

Note: NestJS path is `/zones` (no `/api` prefix). Go path is `/api/zones/` (trailing slash).

## Damage Reports

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/damage-reports` | Public | Optional `?zoneId=` filter |
| GET | `/api/damage-reports/{id}` | Public | By ID |
| GET | `/api/zones/{zoneId}/damage-reports` | Public | By zone |
| POST | `/api/damage-reports` | Public | Create report |
| PATCH | `/api/damage-reports/{id}/status` | Public | Status transition |
| DELETE | `/api/damage-reports/{id}` | Public | Delete |

Note: Spring Boot requires auth for PATCH/DELETE (implied by SecurityConfig). Go: all public.

## Storage

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/storage/zones/{id}/photo` | Authenticated | Multipart upload, S3-signed PUT to RustFS |

Not implemented in Go backend.

## Public Map

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/public/map` | Public | Returns `{ zones, damageReports }` |

## Health

| Method | Path | Backends | Notes |
|--------|------|----------|-------|
| GET | `/healthz`, `/live` | All | Liveness probe |
| GET | `/readyz`, `/ready` | All | Readiness (DB, heap, disk, storage) |

## Backend-Specific Details

### NestJS (port 8080)
- Auth: Swagger/Scalar at `/api/docs`
- Rate limiting: 100 read/min, 30 write/min (disabled via DISABLE_RATE_LIMIT)
- CQRS via `@nestjs/cqrs`: 5 zone commands, 2 zone queries, 2 damage-report commands, 2 damage-report queries
- TypeORM migrations in `src/migrations/`
- Seed: 10 demo zones across Algeria via `bun src/seed.ts`

### Spring Boot (port 8081)
- Auth: Swagger UI at `/swagger-ui/index.html`
- Rate limiting: Bucket4j — 5/min auth, 30/min write, 100/min read
- CQRS via custom SimpleCommandBus/SimpleQueryBus: matches NestJS command/query count
- Flyway migrations: `V1/V2/V3` in `resources/db/migration/`
- ArchUnit: 7 architecture enforcement rules

### Go (port 8082)
- No photo upload, no public map endpoint (returns static "ok")
- Does not implement real public/map endpoint — returns `Ping` handler
- No auth guards on write endpoints
- Swappable store: InMemory (default) vs Postgres (`STORE_TYPE=postgres`)
- Goose migration: `001_init.sql` (5 tables)
