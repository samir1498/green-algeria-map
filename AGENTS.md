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

Run everything from `frontend/`.

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm test         # Run unit + integration tests (both configs)
pnpm test:unit    # Unit tests only
pnpm test:it      # Integration tests only
pnpm check        # Type check
pnpm lint         # ESLint
pnpm knip         # Dead code detection
pnpm format       # Prettier format
```

## Import Alias

```ts
import { Button } from '@/components/ui/button'
```

## Conventions

- **Framework**: React 19, TanStack Router (file-based routing)
- **Styling**: Tailwind CSS v4 (CSS-first), shadcn/ui
- **Testing**: Vitest with separate configs (`vitest.unit.config.ts` / `vitest.it.config.ts`)
- **Test naming**:
  - `*.unit.spec.{ts,tsx}` — unit tests (pure logic, hooks in isolation)
  - `*.it.spec.{ts,tsx}` — integration tests (component + API + side-effects)
  - Legacy `*.test.{ts,tsx}` files accepted in unit config but avoid in new code
- **File naming**: PascalCase for components, camelCase for hooks/utils
- **Routes**: File-based in `src/routes/`
- **No comments** in code — clear naming over comments

## Quality Gate

Pre-commit hook runs:
1. `pnpm check` (type check)
2. `lint-staged` (Prettier format on staged files)

CI runs in parallel: check → lint → knip → test → build

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
