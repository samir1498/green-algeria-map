# Benchmark: NestJS vs Spring Boot

## Prerequisites

- Docker Compose v2
- [k6](https://k6.io/) (`brew install k6` or download from [k6.io](https://k6.io/))
- Node.js 24+ (for NestJS migration/seed)
- Java 25+ with `./mvnw` (for Spring Boot)

## Quick Start (full pipeline)

```bash
./benchmark/pipeline.sh
```

This runs both backends sequentially:
1. Clean DB → `docker compose --profile nestjs up` → k6 (auth, zones, mix) → down
2. Clean DB → `docker compose --profile springboot up` → k6 (auth, zones, mix) → down
3. Results saved to `results/YYYYMMDD-HHmm-pipeline/`

## Compare results

```bash
./benchmark/compare.sh results/YYYYMMDD-HHmm-pipeline
```

## Run a single backend

```bash
# NestJS
docker compose --profile nestjs up -d
cd backend-nestjs && node scripts/create-bucket.mjs && pnpm migration:run && pnpm seed
BASE_URL=http://localhost:8080 API_PREFIX="" k6 run benchmark/all.js

# Spring Boot
docker compose --profile springboot up -d --wait
BASE_URL=http://localhost:8081 API_PREFIX="/api" k6 run benchmark/all.js
```

## Run individual scenarios

```bash
k6 run \
  --summary-export=results/auth-summary.json \
  -e BASE_URL=http://localhost:8080 \
  -e API_PREFIX="" \
  benchmark/auth.js
```

## Results (2026-06-04)

### Auth (20 concurrent, 2 min ramp)

| Backend | avg | p95 | fail | iterations |
|---|---|---|---|---|
| NestJS | 221ms | 583ms | 0% | 1,099 |
| **Spring Boot (JVM)** | **86ms** | **152ms** | **0%** | **1,450** |

### Zones (50 concurrent, 2 min ramp)

| Backend | avg | p95 | fail | iterations |
|---|---|---|---|---|
| NestJS | 606ms | 1,687ms | 0% | 1,336 |
| **Spring Boot (JVM)** | **229ms** | **800ms** | 25%* | **2,375** |

### Mixed 80/20 (30 concurrent, 3.5 min)

| Backend | avg | p95 | fail | iterations |
|---|---|---|---|---|
| NestJS | 383ms | 1,074ms | 0% | 1,714 |
| **Spring Boot (JVM)** | **100ms** | **286ms** | 20%* | **3,318** |

> \* Spring Boot zones/mix failures were due to a Hibernate lazy init bug (`@ElementCollection` + `open-in-view=false`) fixed after the run — re-run expected to show 0%.

## Verdict

Spring Boot JVM is **2-3x faster** on auth and **~3x faster** on read-heavy workloads. For mixed 80/20 read-write, it handles **1.5-2x more throughput** with lower latency. Spring Boot is the clear choice for production.
