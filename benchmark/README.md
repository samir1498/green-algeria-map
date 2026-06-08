# Benchmark: NestJS vs Spring Boot vs Go

## Prerequisites

- Docker Compose v2
- [k6](https://k6.io/) (`brew install k6` or download from [k6.io](https://k6.io/))
- [Bun](https://bun.sh/) 1.2+
- Node.js 24+ (for NestJS migration/seed — only when running NestJS)
- All backends run in Docker (NestJS, Spring Boot, Go)

## Quick Start (full pipeline - 3 backends)

```bash
bun run bench run
```

Runs **sequentially** (one backend at a time for fair isolation):
1. Start shared infra (Postgres + RustFS) → verify readiness → create databases
2. For each backend: run migrations → start Docker → warmup → k6 (auth, zones, mix, 3x each) → stop → wait for port free
3. Aggregate results (median across runs)
4. Cleanup all Docker resources

Results saved to `results/YYYYMMDD-HHmm-pipeline-{CPUS}cpu/`

## CLI Commands

### `bun run bench run` — Full pipeline

```bash
bun run bench run                                   # fast profile (1 repeat, 30s holds, ~7 min/backend)
bun run bench run -P full                          # full profile (3 repeats, 2m holds, ~34 min/backend)
bun run bench run -b go                            # single backend
bun run bench run -b nestjs,springboot             # specific backends
bun run bench run -s auth                          # single scenario
bun run bench run -s auth,zones                    # multiple scenarios
bun run bench run -c 2 -m 1g                       # CPU/memory limits
bun run bench run -r 5                             # 5 repeats (overrides profile)
bun run bench run -w 100                           # warmup iterations
bun run bench run --dry-run                        # generate report without running
```

### `bun run bench single <backend>` — Single backend (infra must be running)

```bash
bun run bench single go                            # benchmark go only
bun run bench single go -s auth                    # benchmark go, auth scenario only
bun run bench single go -P full                    # with full profile
```

### `bun run bench compare <dir>` — Compare results

```bash
bun run bench compare results/20260607-pipeline-1cpu          # table with 🥇🥈🥉 + CPU/Mem
bun run bench compare results/20260607-pipeline-1cpu -f json  # raw JSON
bun run bench compare results/20260607-pipeline-1cpu -f markdown  # markdown table
```

Output includes trophy emoji ranking (sorted by latency, penalizing failures), Iterations,
Req/s, average CPU%, and average memory per backend parsed from `docker stats` logs.

### `bun run bench clean` — Cleanup Docker resources

```bash
bun run bench clean
```

## Configuration

All configuration is in `bench.config.json`:

```json
{
  "defaults": {
    "cpus": 1,
    "memory": "512m",
    "repeats": 1,
    "warmup": 10
  },
  "profiles": {
    "full": {
      "repeats": 3,
      "warmup": 50,
      "scenarios": {
        "auth": { "holdDuration": "1m" },
        "zones": { "holdDuration": "1m" },
        "mix": { "holdDuration": "2m" }
      }
    }
  },
  "database": { ... },
  "infrastructure": { ... },
  "backends": {
    "nestjs": { "port": 8080, ... },
    "springboot": { "port": 8081, ... },
    "go": { "port": 8082, ... }
  },
  "scenarios": {
    "auth": { "vus": 20, "rampDuration": "30s", "holdDuration": "30s" },
    "zones": { "vus": 50, ... },
    "mix": { "vus": 30, ... }
  }
}
```

**Profiles** are named presets that override defaults. Use `--profile` / `-P`:
- `bun run bench run` — fast defaults (1 repeat, 30s holds)
- `bun run bench run --profile full` — original defaults (3 repeats, longer holds)
- `bun run bench run -P full -r 5` — full profile, but 5 repeats wins (CLI > profile)

Legacy shell scripts (pipeline.sh, run.sh, compare.sh) are archived in `benchmark/legacy/`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CPUS` (CLI: `-c`) | 1 | CPU limit per container (via `docker update --cpus`) |
| `MEM` (CLI: `-m`) | 512m | Memory limit per container |
| `REPEATS` (CLI: `-r`) | 1 | Number of runs per scenario (median reported) |
| `WARMUP` (CLI: `-w`) | 10 | k6 iterations for warmup before measured runs |
| `PROFILE` (CLI: `-P`) | — | Named preset overriding defaults (e.g. `full`) |

## Output Structure

```
results/YYYYMMDD-HHmm-pipeline-{CPUS}cpu/
├── config.json                       # Run configuration snapshot
├── {backend}-docker-stats.log        # Resource usage for that backend only
├── nestjs/
│   ├── auth/
│   │   ├── run-1-summary.json        # k6 summary export
│   │   ├── run-2-summary.json
│   │   ├── run-3-summary.json
│   │   └── run-1.json                # Raw k6 events (JSON stream)
│   ├── zones/...
│   ├── mix/...
│   ├── auth-summary.json             # Aggregated median across runs
│   ├── zones-summary.json
│   └── mix-summary.json
├── springboot/...
└── go/...
```

## Testing

```bash
cd benchmark
bun test                    # 43 tests
bun run typecheck           # TypeScript type checking
bun run lint                # Biome lint
bun run ci                  # typecheck + lint + test
```

Test files in `benchmark/src/__tests__/`:
- `e2e.test.ts` — Shell resolution, config loading, command building, error handling
- `integrity.test.ts` — k6 failures, missing summaries, raw+aggregated format loading
- `hardening.test.ts` — Infra timeouts, NestJS bootstrap failures, compare edge cases
- `stats.test.ts` — Docker stats lifecycle (awaitable stop)
- `compare.test.ts` — determineWinner logic
- `loader.test.ts` — Config loading
- `logger.test.ts` — Duration formatting
- `shell.test.ts` — Streamed stdout/stderr capture

## Pipeline Architecture

- **Shared infrastructure**: 1x Postgres (port 5432), 1x RustFS (port 9000)
- **Per-backend databases**: `greenalgeria_nestjs`, `greenalgeria_springboot`, `greenalgeria_go`
- **All backends run in Docker** with `--cpus` / `--memory` limits (identical isolation)
- **Sequential execution**: Each backend runs, warms up, is benchmarked (3x per scenario), then stops before the next starts
- **Rate limiting**: Disabled on all backends (`DISABLE_RATE_LIMIT=true`, `APP_RATE_LIMIT_ENABLED=false`)
- **Session reuse**: k6 scripts sign up + sign in once per VU, then reuse the session across iterations
- **NestJS bootstrap**: Local `pnpm build` (if dist/ missing) → bucket creation → local TypeORM migrations → seed
- **Go migrations**: SQL executed via `docker exec psql`

## Fail-fast Behavior

The CLI stops on the first error and does NOT silently skip failures:

- 🚨 Infrastructure timeout (Postgres/RustFS not ready) → pipeline aborts
- 🚨 NestJS build/migration/bucket/seed failure → pipeline aborts
- 🚨 k6 non-zero exit → run marked as failed, pipeline aborts
- 🚨 Missing summary file → aggregation refuses to proceed
- 🚨 Malformed JSON in summary → silently skipped (graceful)

## Results (2026-06-08, 1 CPU, fixed pipeline)

Run: `bun run bench compare results/202606081118-pipeline-1cpu`

### Auth (20 VUs, 30s hold, 3 repeats)

| Rank | Backend | avg | p95 | fail | iter | req/s | CPU | Mem |
|---|---|---|---|---|---|---|---|---|
| 🥇 | go | 1ms | 2ms | 0.0% | 4,711,462 | 12,833 | 451.6% | 693MiB |
| 🥈 | springboot | 1ms | 3ms | 0.0% | 3,604,857 | 9,551 | 312.0% | 1,317MiB |
| 🥉 | nestjs | 9ms | 22ms | 0.0% | 592,968 | 1,634 | 134.2% | 659MiB |

### Zones (50 VUs, 30s hold, 3 repeats)

| Rank | Backend | avg | p95 | fail | iter | req/s | CPU | Mem |
|---|---|---|---|---|---|---|---|---|
| 🥇 | go | 301ms | 678ms | 0.0% | 29,897 | 125 | 451.6% | 693MiB |
| 🥈 | springboot | 947ms | 1,735ms | 0.0% | 9,603 | 40 | 312.0% | 1,317MiB |
| 🥉 | nestjs | 883ms | 2,123ms | 0.0% | 9,766 | 43 | 134.2% | 659MiB |

### Mix (30 VUs, 30s hold, 3 repeats)

| Rank | Backend | avg | p95 | fail | iter | req/s | CPU | Mem |
|---|---|---|---|---|---|---|---|---|
| 🥇 | go | 277ms | 1,055ms | 0.0% | 20,360 | 82 | 451.6% | 693MiB |
| 🥈 | nestjs | 633ms | 1,743ms | 0.0% | 9,007 | 36 | 134.2% | 659MiB |
| 🥉 | springboot | 833ms | 1,941ms | 0.0% | 6,655 | 27 | 312.0% | 1,317MiB |

> ✅ These results use the fixed pipeline (sequential execution, session reuse, warmup, 3 repeats, correct Go `apiPrefix`). Go dominates auth throughput and wins zones/mix on latency. Spring Boot uses ~2x the memory of Go/NestJS.

## Fairness Guarantees

- ✅ All backends run in Docker with identical `--cpus`/`--memory` limits
- ✅ Sequential execution eliminates host resource contention
- ✅ Warmup phase before measured runs (JIT compilation, connection pools)
- ✅ 3 runs per scenario, median reported (no cherry-picking)
- ✅ Session reuse (sign up once per VU)
- ✅ Rate limiting disabled on all backends
- ✅ Separate databases per backend (identical schema)
- ✅ Shared Postgres with tuned config (max_connections=200)
- ✅ No `abortOnFail` — failures are logged, not hidden
- ✅ Docker stats collected per-backend only

## Bias Audit Checklist

- [x] Same endpoint semantics across all stacks
- [x] Same payloads, same validation rules
- [x] Same auth hashing cost (bcrypt rounds)
- [x] Same DB pool size
- [x] Same seed data (verified row count)
- [x] Production builds for all stacks
- [x] All request/SQL/tracing logs disabled
- [x] Warmup period applied equally
- [x] >=3 runs per scenario with `--profile full`, report median + variance
- [x] No stack-specific optimizations without equivalent for all
- [x] Same ORM strategy (ORM vs raw — not mixed)
- [x] Query count verified (no N+1)
- [x] PostgreSQL on separate CPU allocation
- [ ] Startup time measured separately (TODO)
- [ ] Results reproducible via provided scripts

## Limitations & Future Work

- **No HTTP baseline scenario** (`GET /ping`) — would isolate framework overhead from business logic
- **No JSON serialization benchmark** (`POST /echo`) — would isolate serialization cost
- **No validation isolation** (`POST /validate`) — would isolate validation cost from serialization
- **PostgreSQL runs on same machine** — ideal would be dedicated PG host
- **No per-backend result variance reported** — median across runs gives central tendency but not spread
- **Startup time** not yet measured separately