<!-- Context: main@a933f1c8 -->
# Benchmark CLI

Last updated: 2026-06-08

Node.js CLI for running k6 benchmarks against all 3 backends. Built with Bun.

## Commands

| Command | Description |
|---------|-------------|
| `bun run src/index.ts run [--profile full]` | Full pipeline: infra → per-backend: warmup → k6 scenarios → aggregate → compare |
| `bun run src/index.ts single <nestjs|springboot|go> [--scenarios auth,zones,mix]` | One backend (infra must be up) |
| `bun run src/index.ts compare [pipeline_dir]` | Compare latest/specified results, format table/json/markdown |
| `bun run src/index.ts clean` | Docker full cleanup |

## Pipeline Flow

1. fullCleanup → startInfra (postgres + rustfs) → applyLimits → verifyInfra
2. ensureDatabaseExists → runGoMigrations
3. Per backend: build → start → warmup (auth 1 VU) → stats collection → run scenarios × N repeats → aggregate → stop → waitForPortFree
4. fullCleanup

## Profiles (bench.config.json)

| Profile | Repeats | Warmup | Scenarios |
|---------|---------|--------|-----------|
| default | 1 | 10s | all: hold 30s |
| full | 3 | 50s | auth + zones: hold 1m, mix: hold 2m |

CLI flags > profile > config defaults.

## k6 Scripts (benchmark/scripts/)

| Script | Endpoints | Default VUs | Description |
|--------|-----------|-------------|-------------|
| `auth.js` | POST sign-up/sign-in, GET session | 20 | Auth flow |
| `zones.js` | sign-up/sign-in → GET + POST zones | 50 | Zone CRUD |
| `mix.js` | sign-up/sign-in → GET zones + damage-reports + POST zones | 30 | Mixed workload |
| `all.js` | Combines all 3 as k6 scenarios | varies | Full composite |

## Backend Config

| Backend | Port | API Prefix | Docker Profile | DB Name |
|---------|------|-----------|----------------|---------|
| nestjs | 8080 | (empty) | nestjs | greenalgeria_nestjs |
| springboot | 8081 | /api | springboot | greenalgeria_springboot |
| go | 8082 | /api | go | greenalgeria_go |

## Results

Pipeline output: `results/{timestamp}/` with per-backend/scenario JSON + aggregate + comparison table.
