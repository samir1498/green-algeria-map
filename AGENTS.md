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
pnpm test         # Run tests
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
- **Testing**: Vitest
- **File naming**: PascalCase for components, camelCase for hooks/utils
- **Routes**: File-based in `src/routes/`
- **No comments** in code — clear naming over comments

## Quality Gate

Pre-commit hook runs:
1. `pnpm check` (type check)
2. `lint-staged` (Prettier format on staged files)

CI runs in parallel: check → lint → knip → test → build

## Skills

- `.claude/skills/pc-version-bump/` — Bump version, update CHANGELOG, tag a release