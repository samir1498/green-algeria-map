# Green Algeria Map — Frontend

React 19 SPA with TanStack Router, TanStack Query, Leaflet, and Tailwind 4.

## Source layout

```
src/
├── app/              # Router factory
├── routes/           # File-based routes (TanStack Router)
├── features/         # Domain slices (api, hooks, components per feature)
│   ├── auth/
│   ├── zones/
│   ├── damage-reports/
│   └── map/
└── shared/           # Cross-cutting types, UI, demo fallbacks, constants
    ├── components/ui/
    ├── constants/
    ├── demo/
    ├── lib/
    ├── types/
    └── utils/
```

## Layer rules

Enforced by `dependency-cruiser`:

| Layer                    | May import                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| `routes/`                | hooks, shared, components (not feature `api/` except `features/auth/api/` for session in loaders) |
| `features/*/components/` | hooks, shared (not feature `api/`)                                                                |
| `features/*/hooks/`      | feature `api/`, shared (not components)                                                           |
| `features/*/api/`        | shared only                                                                                       |

Data flow: **routes → hooks → api → axios**.

## Tests

| Suffix          | Environment                 | Purpose                        |
| --------------- | --------------------------- | ------------------------------ |
| `*.unit.spec.*` | node (or jsdom when marked) | Pure logic, hooks, API clients |
| `*.ui.spec.*`   | jsdom                       | Components and routes          |
| `*.it.spec.*`   | jsdom + MSW                 | Integration flows              |

```bash
pnpm test:unit
pnpm test:ui
pnpm test:it
pnpm test
```

## Quality

```bash
pnpm check
pnpm lint
pnpm knip
pnpm depcruise src
pnpm build
```
