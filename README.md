# Green Algeria Map

Map-based platform for tracking reforestation efforts across Algeria. Monitor tree planting initiatives, visualize green coverage, and support environmental restoration projects.

## Tech Stack

- **Frontend**: React 19, TanStack Router, Tailwind CSS v4
- **Backend**: NestJS, Spring Boot
- **Package Manager**: pnpm (monorepo)

## Project Structure

```
green-algeria-map/
├── frontend/          # React + TanStack Router SPA
├── backend-nestjs/    # NestJS backend (coming soon)
├── backend-springboot/ # Spring Boot backend (coming soon)
└── pnpm-workspace.yaml
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Install & Run

```bash
pnpm install
pnpm dev          # Start all packages
```

### Run Specific Package

```bash
pnpm --filter frontend dev
pnpm --filter backend-nestjs dev
pnpm --filter backend-springboot dev
```

## Architecture

- **Frontend**: Single-page application with file-based routing, API integration for map data
- **Backend**: REST API services (not yet scaffolded)
- **Map Data**: Tree planting locations, coverage stats, regional progress

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development servers |
| `pnpm build` | Build all packages |
| `pnpm test` | Run tests |
| `pnpm lint` | Lint all packages |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

See [LICENSE](LICENSE).