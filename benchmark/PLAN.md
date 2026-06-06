# Benchmark — Phase 0: Fair Scenario Isolation

## Goal

Bias-resistant benchmark for **NestJS** (Express + Fastify) and **Spring Boot** (JVM + Native) that isolates each layer to identify real bottlenecks.

Current benchmarks test everything together (framework + DB + auth + serialization), making it impossible to tell where the bottleneck is.

## Hard Rules

- Exact same endpoint semantics, payloads, validation, auth/session logic, errors, status codes, headers, DB schema, indexes, query behavior, pool size, seed data, timeouts
- Run only one backend at a time
- Identical Docker CPU/RAM limits per backend (`--cpus=1 --memory=512m`)
- Same load tool (k6), same scenarios, same VUs, same ramp, same duration, same concurrency levels, same payloads
- **Production builds only.** No dev mode, hot reload, debug, tracing, request logs, SQL logs
- Warm all runtimes equally. Measure startup separately.
- Repeat each run **>=3 times**. Report median + variance. No cherry-picking.
- No stack-specific shortcut unless equivalent shortcut exists for all stacks
- Same DB access strategy across stacks: **all ORM or all raw query builder.** No mixing ORM in one and raw SQL in another.
- Verify query count and SQL. No N+1 allowed.
- Never run PostgreSQL on the same CPU allocation as the backend

## Scenarios

### 1. HTTP Baseline: `GET /ping`

- Returns `{ "status": "ok" }` — static JSON, no DB, no auth, no validation
- What it measures: raw framework overhead (routing, middleware pipeline, JSON serialization)

### 2. JSON Serialization: `POST /echo`

- Accepts and returns a medium JSON payload (15-20 fields, nested objects, arrays)
- Validates input (class-validator / Jakarta Validation)
- No DB, no auth
- What it measures: serialization/deserialization + validation overhead
- Payload:
  ```json
  {
    "name": "string",
    "email": "string",
    "age": 25,
    "address": { "street": "string", "city": "string", "zip": "string" },
    "tags": ["a", "b", "c"],
    "metadata": { "key1": "value1", "key2": 42 }
  }
  ```

### 3. Validation: `POST /validate`

- Same DTO validation rules as /echo but returns only `{ "valid": true }`
- No DB, no auth
- Isolates validation cost from serialization cost

### 4. Auth CPU: login/session flow

- In-memory fake user store (no DB)
- Same hashing (bcrypt rounds), same JWT settings, same session handling
- Flow: sign-up → sign-in → get-session → sign-out
- What it measures: CPU-bound crypto + hashing overhead without DB interference

### 5. CRUD In-Memory Repository

- Same CRUD API (create, read, list, update, delete) using in-memory data store
- No PostgreSQL
- What it measures: framework request lifecycle + business logic overhead without DB

### 6. CRUD with PostgreSQL (runs separately)

- Run phases 1-5 first without DB, then run this phase with DB
- One backend at a time against PostgreSQL
- Same schema, same indexes, same pool size (explicitly fixed, e.g. 10 connections)
- Preload identical seed data (exact same rows)
- Reset DB before each measured run
- Capture: query count, query duration, pool wait time, slow queries (>100ms)

### 7. Mixed 80/20 Read-Write

- Run with both in-memory and PostgreSQL variants
- 80% reads / 20% writes
- Same operation mix across all stacks

## PostgreSQL Isolation

- Never run backends concurrently against PostgreSQL
- Reset DB before each measured run
- Same seed data (identical rows, same IDs)
- Explicit identical pool size (e.g. 10 connections)
- Capture PostgreSQL CPU/RAM, active/idle connections, locks, slow queries, query count, query latency, pool wait, transaction duration
- Prefer PostgreSQL on separate CPU allocation if possible

## Stack-Specific Fairness

### NestJS

- Test both Express and Fastify adapters
- Disable `class-transformer` unless Spring uses equivalent transformation cost
- Avoid request-scoped providers
- Capture event-loop delay
- Detect sync crypto/logging/blocking awaits
- Ensure `NODE_ENV=production` and `--max-old-space-size` set correctly

### Spring Boot

- Test both JVM and Native (GraalVM) images
- JVM: production profile, record JVM/GC/heap/GC pauses, fair warmup
- Native: same code path/config, report native build config, startup measured separately
- Disable DevTools
- `spring.jpa.show-sql=false`, `logging.level.root=WARN`

## Output

Per scenario:
| Metric | NestJS (Express) | NestJS (Fastify) | Spring JVM | Spring Native |
|--------|------------------|------------------|------------|---------------|
| avg    |                  |                  |            |               |
| med    |                  |                  |            |               |
| p90    |                  |                  |            |               |
| p95    |                  |                  |            |               |
| p99    |                  |                  |            |               |
| max    |                  |                  |            |               |
| failed |                  |                  |            |               |
| req/s  |                  |                  |            |               |

Resource usage:
| Metric | NestJS (Express) | NestJS (Fastify) | Spring JVM | Spring Native |
|--------|------------------|------------------|------------|---------------|
| CPU avg |                |                  |            |               |
| CPU max |                |                  |            |               |
| RAM avg |                |                  |            |               |
| RAM max |                |                  |            |               |
| GC/event-loop delay | |                  |            |               |
| DB query count |      |                  |            |               |
| DB latency |          |                  |            |               |
| DB pool wait |        |                  |            |               |

## Bias Audit Checklist

- [ ] Same endpoint semantics across all stacks
- [ ] Same payloads, same validation rules
- [ ] Same auth hashing cost (bcrypt rounds)
- [ ] Same DB pool size
- [ ] Same seed data (verified row count)
- [ ] Production builds for all stacks
- [ ] All request/SQL/tracing logs disabled
- [ ] Warmup period applied equally
- [ ] >=3 runs per scenario, report median + variance
- [ ] No stack-specific optimizations without equivalent for all
- [ ] Same ORM strategy (ORM vs raw — not mixed)
- [ ] Query count verified (no N+1)
- [ ] PostgreSQL on separate CPU allocation
- [ ] Startup time measured separately
- [ ] Results reproducible via provided scripts

## Attribution

Explain whether the bottleneck is:
- Framework (routing, middleware pipeline)
- Runtime (GC, event loop, JIT warmup)
- DB (queries, pool, schema)
- Crypto (bcrypt rounds, JWT signing)
- Validation (class-validator / Jakarta Validation)
- Serialization (JSON encoding/decoding)
- Logging (sync I/O, log levels)

No global winner unless consistent across all scenarios.

## Deliverables

- Docker Compose files per stack
- Dockerfiles (production builds)
- Benchmark k6 scripts (one per scenario)
- Seed/reset scripts
- Schema + index definitions
- Reproducibility steps in README
- Result tables (median + variance across 3 runs)
- Bias audit checklist (completed)
- Final analysis report

## Appendix: Why This Matters

The current results show Spring Boot JVM 2-3x faster than NestJS, but preview feedback suggests NestJS numbers are anomalously low (13 req/s for a single scenario). By isolating layers with strict bias controls, we can:
- Confirm whether the bottleneck is NestJS itself or specific configuration (ORM, validation, adapter)
- Test if Fastify adapter closes the gap with Express
- Measure GraalVM Native vs JVM warmup penalties
- Produce a defendable, reproducible benchmark worth publishing
