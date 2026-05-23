# Green Algeria Map — Backend

NestJS 11 API with CQRS, BetterAuth, TypeORM, and PostgreSQL 18.

## Architecture

```text
Controller → CommandBus / QueryBus → Handlers → Repository → TypeORM
                                              ↑
                                        Domain entity
```

| Layer | Responsibility | Location |
|-------|----------------|----------|
| **Presentation** | Controllers, DTOs | `*.controller.ts`, `dto/` |
| **Application** | Commands, queries, events | `application/{commands,queries,events}/<name>/` |
| **Domain** | Entities, value objects, domain errors | `domain/` |
| **Infrastructure** | ORM entities, mappers, repositories | `infrastructure/` |

Repositories are concrete classes injected into handlers (no port/adapter layer).

### CQRS (zones example)

- **Commands:** `application/commands/create-zone/`
- **Queries:** `application/queries/get-all-zones/`
- **Events:** `application/events/zone-created/`

Same nested layout is used for `damage-reports`.

### Auth

- BetterAuth with email/password via `@thallesp/nestjs-better-auth`
- Global auth guard; zone GET routes use `@Public()` (`AllowAnonymous`)
- User roles: `volunteer`, `reporter`, `organizer`, `admin`

## Modules

```text
src/modules/
├── auth/             # BetterAuth config + entities (no application layer)
├── zones/
└── damage-reports/
```

Shared cross-cutting code: `src/lib/` (`domain-error`, exception filter).

## Setup

```bash
pnpm install
```

### Environment

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
docker compose up -d db
pnpm migration:run
npx ts-node src/seed.ts
```

## Running

```bash
pnpm start:dev
```

API docs: `http://localhost:8080/api/docs` (Scalar).

## Quality

```bash
pnpm check
pnpm lint
pnpm knip
pnpm depcruise src
pnpm test:unit
pnpm test:it
```

Integration tests require Docker (testcontainers).

## API (zones)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/zones` | Public | List zones |
| GET | `/zones/:id` | Public | Get zone |
| POST | `/zones` | Required | Create zone |
| PATCH | `/zones/:id` | Required | Update zone |
| DELETE | `/zones/:id` | Required | Delete zone |

Damage reports: `/damage-reports` (see Swagger).
