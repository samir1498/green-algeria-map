# Benchmark: NestJS vs Spring Boot

## Prerequisites

- Docker Compose v2
- [k6](https://k6.io/) (`brew install k6` or download from [k6.io](https://k6.io/))
- Node.js 24+ (for NestJS migration/seed)
- Java 25+ with `./mvnw` (for Spring Boot)

## Quick Start (full matrix)

```bash
# 1 CPU / 512MB run (~15 min)
./benchmark/pipeline-matrix.sh 1

# 2 CPU / 512MB run (~15 min)
./benchmark/pipeline-matrix.sh 2
```

This runs all 3 backends (NestJS, Spring Boot JVM, Spring Boot Native) sequentially with clean DB between each.

## Compare results

```bash
./benchmark/compare-matrix.sh results/YYYYMMDD-HHmm-matrix-1cpu
./benchmark/compare-matrix.sh results/YYYYMMDD-HHmm-matrix-2cpu
```

## Run a single backend (legacy)

```bash
# NestJS
docker compose --profile nestjs up -d
cd backend-nestjs && node scripts/create-bucket.mjs && pnpm migration:run && pnpm seed
BASE_URL=http://localhost:8080 API_PREFIX="" k6 run benchmark/all.js

# Spring Boot JVM
docker compose --profile springboot up -d --wait
BASE_URL=http://localhost:8081 API_PREFIX="/api" k6 run benchmark/all.js

# Spring Boot Native
docker compose --profile springboot-native up -d --wait
BASE_URL=http://localhost:8082 API_PREFIX="/api" k6 run benchmark/all.js
```

## Environment

| Property | Value |
|----------|-------|
| **Machine** | 12 cores / 15GiB RAM |
| **OS** | Fedora 44 |
| **Docker** | 29.5.2 |
| **Java** | OpenJDK 25.0.2-graalce |
| **Node** | 24-alpine (in Docker) |
| **k6** | latest (host) |
| **PostgreSQL** | 18-alpine (in Docker) |
| **Resource limits** | `cpus: $CPU_LIMIT`, `mem_limit: 512m` per container |
| **DB per run** | `docker compose down -v` (fresh DB each backend) |

## Results (2026-06-05)

All 3 backends at 1 CPU / 512MB and 2 CPU / 512MB, parallel k6 scenarios (auth 20 VU, zones 50 VU, mix 30 VU, ~3.5 min total).

```
Backend                 | Auth avg | Auth p95 | Zones avg | Zones p95 | Mix avg  | Mix p95  |  Fail  |    Iter
------------------------------------------------------------------------------------------------------------------
     NestJS 1 CPU       |   185ms  |   487ms  |     553ms |    1687ms |   314ms  |  1074ms  |  0.0%  |    1714
     NestJS 2 CPU       |    ...   |    ...   |       ... |       ... |     ...  |     ...  |   ...  |     ...
    SB JVM 1 CPU        |    52ms  |    93ms  |     130ms |     800ms |   143ms  |   286ms  |  0.0%  |    3318
    SB JVM 2 CPU        |    ...   |    ...   |       ... |       ... |     ...  |     ...  |   ...  |     ...
  SB Native 1 CPU       |    ...   |    ...   |       ... |       ... |     ...  |     ...  |   ...  |     ...
  SB Native 2 CPU       |    ...   |    ...   |       ... |       ... |     ...  |     ...  |   ...  |     ...
```

> Results from previous run (unconstrained): NestJS auth avg 221ms, zones avg 606ms, mix avg 383ms. SB JVM auth avg 86ms, zones avg 229ms, mix avg 100ms (with Hibernate lazy init bug causing 20-25% failures — fixed).

## Run individual scenarios

```bash
k6 run \
  --summary-export=results/auth-summary.json \
  -e BASE_URL=http://localhost:8080 \
  -e API_PREFIX="" \
  benchmark/auth.js
```
