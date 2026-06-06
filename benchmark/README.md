# Benchmark: NestJS vs Spring Boot vs Go

## Prerequisites

- Docker Compose v2
- [k6](https://k6.io/) (`brew install k6` or download from [k6.io](https://k6.io/))
- Node.js 24+ (for NestJS migration/seed)
- Java 25+ with `./mvnw` (for Spring Boot)
- Go 1.25+ (for Go backend - runs in Docker)

## Quick Start (full pipeline - 3 backends)

```bash
./benchmark/pipeline.sh
```

Runs **sequentially** (one backend at a time for fair isolation):
1. Start shared infra (Postgres + RustFS) → NestJS native → k6 (auth, zones, mix) → stop NestJS
2. Spring Boot (Docker) → k6 → stop Spring Boot
3. Go (Docker) → k6 → stop Go

Results saved to `results/YYYYMMDD-HHmm-pipeline-{CPUS}cpu/`

## Compare results

```bash
./benchmark/compare.sh results/YYYYMMDD-HHmm-pipeline-1cpu
```

## Run a single backend

```bash
# NestJS (native, not Docker)
docker compose up -d postgres rustfs
cd backend-nestjs && node scripts/create-bucket.mjs && pnpm migration:run && pnpm seed
BASE_URL=http://localhost:8080 API_PREFIX="" k6 run benchmark/all.js

# Spring Boot
docker compose --profile springboot up -d --wait
BASE_URL=http://localhost:8081 API_PREFIX="/api" k6 run benchmark/all.js

# Go
docker compose --profile go up -d --wait
BASE_URL=http://localhost:8082 API_PREFIX="" k6 run benchmark/all.js
```

## Run individual scenarios

```bash
k6 run \
  --summary-export=results/auth-summary.json \
  -e BASE_URL=http://localhost:8080 \
  -e API_PREFIX="" \
  benchmark/auth.js
```

## Configuration

```bash
CPUS=2 MEM=512m ./benchmark/pipeline.sh   # 2 CPU limit
```

## Pipeline Architecture

- **Shared infrastructure**: 1x Postgres (port 5432), 1x RustFS (port 9000)
- **Per-backend databases**: `greenalgeria_nestjs`, `greenalgeria_springboot`, `greenalgeria_go`
- **NestJS**: Runs natively via `systemd-run` (CPUQuota/MemoryMax)
- **Spring Boot + Go**: Run in Docker with `--cpus` / `--memory` limits
- **Rate limiting**: Disabled on all backends (`DISABLE_RATE_LIMIT=true`, `APP_RATE_LIMIT_ENABLED=false`)

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

> ⚠️ Go failures in zones/mix under load: investigation ongoing (likely connection pool contention with shared Postgres). Standalone Go tests pass 0% failures.

## Verdict (1 CPU)

- **Auth**: Go wins (2-3x NestJS, ~1.5x Spring Boot)
- **Zones**: Spring Boot wins (stable, Go has 50% failures under load)
- **Mixed**: Spring Boot wins (balanced latency + 0% failures)
- **Resource usage**: Go 14MiB / 385% CPU, NestJS 435MiB / 208% CPU, Spring Boot 476MiB / 359% CPU