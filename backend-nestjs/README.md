# Green Algeria Map — Backend

NestJS 11 API with CQRS, BetterAuth, TypeORM, and PostgreSQL 18.

## Architecture

### Clean Architecture Layers

```
Controller → CommandBus/QueryBus → Handlers → ZoneRepository (interface) ← ZoneRepositoryImpl → TypeORM
                                                    ↑
                                              Domain Entity
```

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | Controllers, DTOs, auth decorators | `zones.controller.ts`, `dto/` |
| **Application** | Commands, queries, event handlers | `application/{commands,queries,events}/` |
| **Domain** | Entities, value objects, repository interfaces | `domain/` |
| **Infrastructure** | TypeORM entities, mappers, repository impls | `infrastructure/` |

### CQRS

- **Commands** (writes): `CreateZone`, `UpdateZone`, `DeleteZone`
- **Queries** (reads): `GetAllZones`, `GetZoneById`
- **Events**: `ZoneCreated` — side effects (logging, future notifications)

### Auth

- BetterAuth with email/password authentication
- `@thallesp/nestjs-better-auth` provides global `AuthGuard`
- Zone GET routes are `@AllowAnonymous()`, writes require auth
- User `role` field: `volunteer`, `reporter`, `organizer`, `admin`

## Setup

```bash
pnpm install
```

### Environment Variables

```env
NODE_ENV=development
PORT=8080
CLIENT_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:8080

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=greenalgeria
DB_PASSWORD=greenalgeria
DB_NAME=greenalgeria
DATABASE_URL=postgresql://greenalgeria:greenalgeria@localhost:5432/greenalgeria
```

### Database

```bash
# Start PostgreSQL
docker compose up -d db

# Run migrations
pnpm migration:run

# Seed demo data
bun src/seed.ts
```

## Running

```bash
pnpm start:dev    # Watch mode (port 8080)
pnpm start        # Single run
pnpm start:prod   # Production (dist/main)
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm start:dev` | Dev server (watch mode) |
| `pnpm build` | Compile to dist/ |
| `pnpm check` | Type check (`tsc --noEmit`) |
| `pnpm lint` | ESLint |
| `pnpm knip` | Dead code detection |
| `pnpm depcruise` | Circular dependency detection |
| `pnpm test` | Jest tests |
| `pnpm migration:generate` | Generate migration |
| `pnpm migration:run` | Apply migrations |
| `pnpm migration:revert` | Revert last migration |
| `bun src/seed.ts` | Seed demo zones |

## API

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/sign-up/email` | Register |
| POST | `/api/auth/sign-in/email` | Sign in |
| GET | `/api/auth/get-session` | Get session |
| POST | `/api/auth/sign-out` | Sign out |

### Zones

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/zones` | Public | List all zones |
| GET | `/zones/:id` | Public | Get zone by ID |
| POST | `/zones` | Required | Create zone |
| PATCH | `/zones/:id` | Required | Update zone |
| DELETE | `/zones/:id` | Required | Delete zone |

API docs at `http://localhost:8080/api/docs` (Scalar, moon theme).

## Module Structure

```
src/modules/zones/
├── domain/
│   ├── zone.ts                    # Domain entity with invariants
│   ├── zone.types.ts              # ZoneType, ZoneStatus constants
│   ├── coordinates.value-object.ts # Coordinates value object
│   └── zone.repository.ts         # Repository interface
├── application/
│   ├── commands/                  # Write operations
│   ├── queries/                   # Read operations
│   └── events/                    # Domain events + handlers
├── infrastructure/
│   ├── zone.orm-entity.ts         # TypeORM entity
│   ├── zone.mapper.ts             # Domain ↔ ORM mapper
│   └── zone.repository.impl.ts    # Repository implementation
├── dto/                           # Request validation
├── zones.controller.ts
└── zones.module.ts
```
