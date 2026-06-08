---
name: benchmark
description: Use when working on the benchmark CLI, k6 scripts, profile system, or pipeline. Covers bench.config.json, profiles, k6 scripts, pipeline flow, docker compose, and infra config.
---

# Benchmark — green-algeria-map

## Pipeline Flow

1. **Preflight** — check infra (postgres, rustfs) and backend containers are running
2. **Warmup** — optional, sends light traffic to warm up the backend
3. **Run scenarios** — auth → zones → mix (in sequence) at specified VUs/duration
4. **Aggregate** — merge k6 JSON summaries across runs
5. **Report** — generate markdown report or compare two runs

## Config

`benchmark/bench.config.json` — central config with:
- `defaults`: `cpus`, `memory`, `repeats`, `warmup`
- `profiles`: named profiles override defaults (e.g. `full` profile with 3 repeats, 50 warmup, longer holds)
- `database`: postgres connection
- `infrastructure`: container names, object storage
- `backends`: per-backend port, apiPrefix, healthUrl, profile, containerName
- `scenarios`: per-scenario VUs, ramp, hold durations

### API Prefixes

| Backend     | apiPrefix |
|-------------|-----------|
| NestJS      | `""`      |
| Spring Boot | `/api`    |
| Go          | `/api`    |

### Profile Merge Cascade

CLI `--profile` > profile values > config defaults. Per-scenario overrides also cascade.

## Commands

```bash
# From benchmark/
pnpm run        # Run benchmark (default profile)
pnpm run -- --profile full   # Full profile
pnpm single --backend springboot --scenario auth  # Single scenario
pnpm compare <dir1> <dir2>   # Compare two result dirs
pnpm ls         # List recent results
```

### Flags

- `--profile`, `-P` — profile name from config
- `--dry-run` — print plan without executing
- `--skip-warmup` — skip warmup phase
- `--repeats`, `--warmup` — override config values
- `--vus`, `--ramp-duration`, `--hold-duration` — override scenario values

## k6 Scripts

Located in `benchmark/scripts/`:
- `all.js` — runs all scenarios (auth, zones, mix) as k6 stages
- `zones.js` — zone CRUD scenario
- `auth.js` — auth scenario
- `mix.js` — mixed workload

Scripts accept env vars: `API_PREFIX` (default `/api`), `BASE_URL` (default `http://localhost:8080`).

## Docker Compose

- `docker-compose.yml` — main compose (postgres + rustfs)
- `config/docker-compose.e2e.yml` — e2e compose
- Backend services run via Docker Compose profiles: `nestjs`, `springboot`, `go`

## Benchmark Docker

The benchmark CLI uses `TEMPLATE` compose from `benchmark/src/docker/compose.ts`:
- Template has `profiles: [BACKEND]`, resource limits, network_mode
- `startBackend()`: spins up the backend container via template
- `stopBackend()`: `docker stop` + `docker rm` on specific container (never `docker compose down -v` — that kills shared infra)

## stopBackend Critical Rule

`stopBackend` must use `docker stop ${containerName}` + `docker rm ${containerName}`. Do NOT use `docker compose --profile X down -v` — the `-v` flag ignores `--profile` and removes all volumes including shared postgres/rustfs data.
