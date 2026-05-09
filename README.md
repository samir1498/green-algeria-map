# Green Algeria Map

Map-based platform for tracking reforestation efforts across Algeria. Volunteers, donors, and organizers can find planting zones, see which trees are needed, track progress with photo verification, and coordinate action.

Built with React 19, TanStack Router, and Leaflet. Styled with Tailwind CSS v4 + shadcn/ui.

## Getting Started

```bash
pnpm install
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (port 3000) |
| `pnpm build` | Production build |
| `pnpm test` | Run tests |
| `pnpm check` | Type check (tsc --noEmit) |
| `pnpm lint` | ESLint |
| `pnpm knip` | Dead code detection |
| `pnpm format` | Prettier format |
| `pnpm format:check` | Prettier check |

## Tech Stack

- **Framework**: React 19, TanStack Router (file-based routing)
- **Styling**: Tailwind CSS v4, shadcn/ui (Radix primitives)
- **Map**: Leaflet, react-leaflet
- **Quality**: ESLint, Prettier, knip, husky, TypeScript strict
- **Package Manager**: pnpm

## Features

- Interactive map with planting zones and trash locations
- Tree type info per zone (recommended species, Wikipedia links)
- Crowdsourced location reporting
- Progress tracking with photo verification
- "How to help" CTAs per location
- Dark/light theme toggle

## License

MIT