# Green Algeria Map — Project Agents

## Project Overview

Map-based platform for tracking reforestation efforts across Algeria.

**Stack**: React 19, TanStack Router, Tailwind CSS v4, shadcn/ui, Leaflet

## Structure

```
green-algeria-map/
├── frontend/          # React + TanStack Router SPA
├── .github/workflows/ # CI pipeline
├── .husky/            # Git hooks
└── AGENTS.md
```

## Commands

Run everything from project root or respective package directory.

### Frontend (`frontend/`)

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm test         # Run unit + ui + integration tests (sequential)
pnpm test:unit    # Unit tests (pure logic, no DOM)
pnpm test:ui      # UI component tests (RTL, no API)
pnpm test:it      # Integration tests (component + MSW + API)
pnpm test:coverage      # All types with coverage (strict thresholds)
pnpm test:coverage:unit # Unit coverage with 80% thresholds
pnpm test:coverage:ci   # All types with coverage (no fail, for CI)
pnpm check        # Type check
pnpm lint         # ESLint
pnpm knip         # Dead code detection
pnpm format       # Prettier format
```

### Backend (`backend-nestjs/`)

```bash
pnpm test         # Run unit + integration tests (sequential)
pnpm test:unit    # Unit tests (pure domain logic, no DI)
pnpm test:it      # Integration tests (Testcontainers + DB)
pnpm test:coverage      # Unit coverage with thresholds
pnpm check        # Type check
pnpm lint         # ESLint
pnpm knip         # Dead code detection
```

## Import Alias

```ts
import { Button } from '@/components/ui/button'
```

## Conventions

### Test Naming & Purpose

| Suffix | Type | What it tests | Env | Vitest config |
|--------|------|---------------|-----|---------------|
| `*.unit.spec.{ts,tsx}` | Unit | Pure logic: helpers, hooks, services, mappers, validators. NO React rendering, NO DOM. | `node` | `vitest.unit.config.ts` |
| `*.ui.spec.{ts,tsx}` | UI | Component: RTL render + user interactions, mock child props. NO API calls. | `jsdom` | `vitest.ui.config.ts` |
| `*.it.spec.{ts,tsx}` | Integration | Full flows: component + MSW + API calls. | `jsdom` | `vitest.it.config.ts` |

### Coding Rules (enforced by test type separation)

- **UI components must NOT contain complex logic** — extract into custom hooks (`use*`), pure helpers, or service functions.
- **Helper functions** must be pure (no side effects). Place in `utils/` or `helpers/` directories.
- **API calls** go through the service layer (`services/`), never called directly from components.
- **Custom hooks** (`hooks/`) can combine state + service calls but must be testable without rendering a component.
- **Rationale**: If you can't test it in a `*.unit.spec.*` file without rendering, it doesn't belong in a component.

### Backend Conventions

- **`*.unit.spec.ts`** — Pure domain logic, value objects, domain services, mappers. NO NestJS DI, NO database.
- **`*.it.spec.ts`** — Integration tests with Testcontainers, actual Postgres DB, full NestJS module compilation.
- **Controllers must be thin** — route delegation only. Domain logic lives in domain classes, not controllers or NestJS services.

### File Naming

- **Components**: `PascalCase.tsx`
- **Hooks/utils**: `camelCase.ts`
- **Config files**: `camelCase.ts`
- **Routes**: File-based via `src/routes/` (TanStack Router convention)
- **No comments** in code — clear naming over comments

## Quality Gate

Pre-commit hook runs:
1. `pnpm check` (type check)
2. `lint-staged` (Prettier format on staged files)

CI runs per package:

### Frontend
```
check ──> lint ──> knip ──> test-unit ──> build
                        ├──> test-ui ────┘
                        ├──> test-it ────┘
                        └──> coverage (report only, no fail)
```

### Backend
```
check ──> lint ──> knip ──> test-unit ──> build
                        └──> test-it ────┘
```

## Git Workflow

- **NEVER push directly to `main`** — always create a PR
- Branch naming: `feat/...`, `fix/...`, `chore/...`, `test/...`, `refactor/...`
- Tag convention: `frontend-vX.Y.Z` / `backend-vX.Y.Z`
- Branch protection enforced on GitHub (1 review required, no force push)

## Post-PR Review Workflow

After creating a PR:
1. Review CodeRabbit comments in the PR
2. Fix all actionable suggestions
3. Commit fixes and push to the same branch
4. Re-trigger review by commenting on the PR: `@coderabbitai review`

## Skills

- `.claude/skills/pc-version-bump/` — Bump version, update CHANGELOG, tag a release
- `.skills/db-migration-cli/` — **NEVER write migrations by hand**. Always use `pnpm migration:generate`, then edit the generated file to keep only relevant changes.
