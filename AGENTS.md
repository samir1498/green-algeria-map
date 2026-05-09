# Green Algeria Map — Project Agents

## Project Overview

Map-based platform for tracking reforestation efforts across Algeria.
- **Frontend**: React 19, TanStack Router, Tailwind CSS v4
- **Backends**: NestJS, Spring Boot (coming soon)

## Project Structure

```
green-algeria-map/
├── frontend/          # React + TanStack Router SPA
├── backend-nestjs/    # NestJS backend (coming soon)
├── backend-springboot/ # Spring Boot backend (coming soon)
├── pnpm-workspace.yaml
└── AGENTS.md          # AI dev conventions
```

## Commands

Run commands from workspace root.

```bash
pnpm install              # Install all packages
pnpm dev                  # Start all packages (if scaffolded)
pnpm build                # Build all packages
pnpm test                 # Run all tests
pnpm lint                 # Lint all packages
```

Run specific package:
```bash
pnpm --filter frontend dev
pnpm --filter frontend test
```

## Import Alias

Frontend uses `@/` for src imports:
```ts
import { Button } from '@/components/Button'
import { useAuth } from '@/hooks/useAuth'
```

## Frontend Conventions

- **Framework**: React 19, TanStack Router (file-based routing)
- **Styling**: Tailwind CSS v4 (CSS-first configuration)
- **Testing**: Vitest
- **File naming**: PascalCase for components, camelCase for hooks/utils
- **Routes**: File-based in `src/routes/`
- **No comments** in code — clear naming over comments

## Frontend Skill Loading

Before substantial frontend work:
- Run `npx @tanstack/intent@latest list` for available skills
- Follow skill guidance for TanStack Router, React patterns

## Backends

- Empty placeholders — do not modify yet
- Will be scaffolded with NestJS CLI and Spring Boot CLI

## Backends Not Yet Scaffolded

Do not modify `backend-nestjs/` or `backend-springboot/` — they are empty placeholders pending CLI scaffolding.