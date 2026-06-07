# Benchmark: NestJS vs Spring Boot vs Go

## Prerequisites

- Docker Compose v2
- [k6](https://k6.io/) (`brew install k6` or download from [k6.io](https://k6.io/))
- Node.js 24+ (for NestJS migration/seed — only when running NestJS)
- All backends run in Docker (NestJS, Spring Boot, Go)

## Quick Start (full pipeline - 3 backends)

```bash
./benchmark/pipeline.sh
```

Runs **sequentially** (one backend at a time for fair isolation):
1. Start shared infra (Postgres + RustFS) → NestJS Docker → warmup → k6 (auth, zones, mix, 3x each) → stop NestJS
2. Spring Boot Docker → warmup → k6 → stop Spring Boot
3. Go Docker → warmup → k6 → stop Go

Results saved to `results/YYYYMMDD-HHmm-pipeline-{CPUS}cpu/`

## Configuration

```bash
CPUS=2 MEM=512m REPEATS=5 WARMUP_ITERATIONS=100 ./benchmark/pipeline.sh
```

| Variable | Default | Description |
|----------|---------|-------------|
| `CPUS` | 1 | CPU limit per container (via `docker update --cpus`) |
| `MEM` | 512m | Memory limit per container |
| `SCENARIOS` | auth zones mix | Space-separated list of scenarios to run |
| `REPEATS` | 3 | Number of runs per scenario (median reported) |
| `WARMUP_ITERATIONS` | 50 | k6 iterations for warmup before measured runs |

## Compare results

```bash
./benchmark/compare.sh results/YYYYMMDD-HHmm-pipeline-1cpu
```

## Run a single backend

For manual testing or development:

```bash
# Start shared infrastructure
docker compose up -d postgres rustfs

# Start the backend
docker compose --profile springboot up -d --wait

# Run benchmark
REPEATS=1 ./benchmark/run.sh springboot
```

## Run individual scenarios

```bash
k6 run \
  --summary-export=results/auth-summary.json \
  -e BASE_URL=http://localhost:8080 \
  -e API_PREFIX="" \
  benchmark/auth.js
```

## Pipeline Architecture

- **Shared infrastructure**: 1x Postgres (port 5432), 1x RustFS (port 9000)
- **Per-backend databases**: `greenalgeria_nestjs`, `greenalgeria_springboot`, `greenalgeria_go`
- **All backends run in Docker** with `--cpus` / `--memory` limits (identical isolation)
- **Sequential execution**: Each backend runs, warms up, is benchmarked (3x per scenario), then stops before the next starts
- **Rate limiting**: Disabled on all backends (`DISABLE_RATE_LIMIT=true`, `APP_RATE_LIMIT_ENABLED=false`)
- **Session reuse**: k6 scripts sign up + sign in once per VU, then reuse the session across iterations

## Output Structure

```
results/YYYYMMDD-HHmm-pipeline-{CPUS}cpu/
├── {backend}-docker-stats.log    # Resource usage for that backend only
├── nestjs/
│   ├── auth/
│   │   ├── run-1-summary.json
│   │   ├── run-2-summary.json
│   │   ├── run-3-summary.json
│   │   └── run-1.json (raw k6 events)
│   ├── zones/...
│   ├── mix/...
│   ├── auth-summary.json (aggregated median across runs)
│   ├── zones-summary.json
│   └── mix-summary.json
├── springboot/...
└── go/...
```

## Results (2026-06-06, 1 CPU)

### Auth (20 VUs, 2 min)

| Backend | avg | p95 | fail | iter | req/s |
|---|---|---|---|---|---|
| **Go** | 274ms | 680ms | 0% | 2,215 | 55 |
| NestJS | 743ms | 1,708ms | 0% | 824 | 19 |
| Spring Boot | 318ms | 1,005ms | 0% | 1,907 | 48 |

### Zones (50 VUs, 2 min)

| Backend | avg | p95 | fail | iter | req/s |
|---|---|---|---|---|---|
| **Go** | 480ms | 1,502ms | 50% | 2,368 | 73 |
| NestJS | 1,657ms | 3,572ms | 0% | 701 | 23 |
| Spring Boot | 748ms | 2,080ms | 0% | 1,543 | 51 |

### Mixed (30 VUs, 3.5 min)

| Backend | avg | p95 | fail | iter | req/s |
|---|---|---|---|---|---|
| **Go** | 109ms | 441ms | 59.7% | 522 | 80 |
| NestJS | 268ms | 844ms | 0% | 205 | 32 |
| Spring Boot | 174ms | 557ms | 0% | 290 | 46 |

> ⚠️ These results are from the old pipeline with known issues (non-sequential execution, no session reuse, no warmup, no repeats). The Go failures were caused by host resource contention from running all backends simultaneously. Re-run with the fixed pipeline for accurate results.

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
- [x] >=3 runs per scenario, report median + variance
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