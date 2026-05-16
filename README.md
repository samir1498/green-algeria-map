# Green Algeria Map

Map-based platform for tracking reforestation and cleanup efforts across Algeria. Volunteers, donors, and organizers can find planting zones, track progress, and coordinate action.

## Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 19, TanStack Router, Tailwind CSS v4, shadcn/ui, Leaflet |
| **Backend** | NestJS 11, TypeORM, PostgreSQL 18 |
| **Quality** | TypeScript strict, ESLint, Prettier, knip, depcruise, husky |
| **CI** | GitHub Actions — frontend + backend workflows with path filters |
| **Runtime** | Docker (PostgreSQL), pnpm, Bun |

## Quick Start

```bash
# Start everything (DB → service selection → tmux session)
./start-dev.sh

# Or manually:
docker run -d --name green-algeria-db \
  -e POSTGRES_USER=greenalgeria \
  -e POSTGRES_PASSWORD=greenalgeria \
  -e POSTGRES_DB=greenalgeria \
  -p 5432:5432 \
  postgres:18-alpine

cd backend-nestjs
bunx --bun typeorm migration:run -d src/data-source.ts
bun src/seed.ts
pnpm start:dev

cd frontend
pnpm dev
```

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

Run from `backend-nestjs/`:

| Command | Description |
|---------|-------------|
| `pnpm start:dev` | Dev server (port 8080, watch mode) |
| `pnpm build` | Compile to dist/ |
| `pnpm lint` | ESLint |
| `bunx --bun typeorm migration:run -d src/data-source.ts` | Run pending migrations |
| `bun src/seed.ts` | Seed demo data (10 zones) |

API docs at `http://localhost:8080/api/docs` (Scalar, moon theme).

## Project Structure

```
green-algeria-map/
├── frontend/           # React SPA
│   ├── src/
│   │   ├── api/        # API client modules
│   │   ├── components/ # Map components + shadcn/ui
│   │   ├── hooks/      # Custom hooks
│   │   ├── lib/        # Utilities
│   │   ├── routes/     # TanStack Router routes
│   │   └── types/      # Shared TypeScript types
│   └── ...
├── backend-nestjs/     # NestJS API
│   ├── src/
│   │   ├── modules/    # Domain modules (zones)
│   │   ├── migrations/ # TypeORM migrations
│   │   └── seed.ts     # Demo data seeder
│   └── ...
├── .github/workflows/  # CI (frontend + backend)
├── start-dev.sh        # Dev environment launcher
└── .tmux.conf          # Tmux config
```

## CI

| Workflow | Triggers | Jobs |
|----------|----------|------|
| CI (frontend) | Changes in `frontend/` or shared infra | check → lint → knip → depcruise → test → build |
| CI Backend | Changes in `backend-nestjs/` or shared infra | lint → build |

## Status

- ✅ Interactive Leaflet map with 10 demo zones, color-coded by status
- ✅ Dark mode, legend, zoom controls, status popups
- ✅ NestJS 11 backend with TypeORM + PostgreSQL
- ✅ Zone CRUD API + Scalar docs
- ✅ TypeORM migration workflow + seed script
- ✅ CI split, depcruise, pre-commit hooks
- 🔄 Frontend → API integration (TanStack Router loaders)
- 📋 Tree info / wiki lookup, damage reporting, photo upload, volunteer CTA

## License

MIT
