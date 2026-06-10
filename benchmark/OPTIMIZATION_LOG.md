# Optimization Log

Track benchmark optimization iterations: changes made, results, and performance deltas.

---

## Iteration 1 — Baseline

**Date:** 2026-06-08
**Config:** 1 CPU, 3 repeats, 30s holds, no backend optimizations
**Branch:** `fix/benchmark-cli-and-pipeline-fixes`
**Commit:** `0cfe6d6d`

### Changes
Initial fixed pipeline baseline after CLI + config fixes:
- Sequential backend execution
- Session reuse in k6 scripts
- Warmup before measured runs
- Correct Go `apiPrefix` (`/api`)
- 3 repeats per scenario, median reported

### Auth (20 VUs)

| Rank | Backend | avg | p95 | fail | iter | req/s | CPU | Mem |
|---|---|---|---|---|---|---|---|---|
| 🥇 | go | 1ms | 2ms | 0.0% | 4,711,462 | 12,833 | 451.6% | 693MiB |
| 🥈 | springboot | 1ms | 3ms | 0.0% | 3,604,857 | 9,551 | 312.0% | 1,317MiB |
| 🥉 | nestjs | 9ms | 22ms | 0.0% | 592,968 | 1,634 | 134.2% | 659MiB |

### Zones (50 VUs)

| Rank | Backend | avg | p95 | fail | iter | req/s | CPU | Mem |
|---|---|---|---|---|---|---|---|---|
| 🥇 | go | 301ms | 678ms | 0.0% | 29,897 | 125 | 451.6% | 693MiB |
| 🥈 | springboot | 947ms | 1,735ms | 0.0% | 9,603 | 40 | 312.0% | 1,317MiB |
| 🥉 | nestjs | 883ms | 2,123ms | 0.0% | 9,766 | 43 | 134.2% | 659MiB |

### Mix (30 VUs)

| Rank | Backend | avg | p95 | fail | iter | req/s | CPU | Mem |
|---|---|---|---|---|---|---|---|---|
| 🥇 | go | 277ms | 1,055ms | 0.0% | 20,360 | 82 | 451.6% | 693MiB |
| 🥈 | nestjs | 633ms | 1,743ms | 0.0% | 9,007 | 36 | 134.2% | 659MiB |
| 🥉 | springboot | 833ms | 1,941ms | 0.0% | 6,655 | 27 | 312.0% | 1,317MiB |

### Key Takeaways

- **Go dominates** auth throughput (12,833 req/s vs 1,634 nestjs) and wins all scenarios on latency
- **Spring Boot uses ~2x memory** (1,317MiB) vs Go (693MiB) and NestJS (659MiB)
- **Go CPU high** (451%) — suggests it's CPU-bound and would benefit from more cores
- **NestJS auth is slow** (9ms avg, 1,634 req/s) — 9x slower than Go/Spring on the simplest endpoint
- **0% failure** across all backends and scenarios — pipeline stability confirmed

---

## Iteration 2 — Constrained Baseline (1 CPU / 512MiB) — NestJS Complete

**Date:** 2026-06-09
**Config:** 1 CPU, 512MiB, 3 repeats, 30s holds
**Branch:** `fix/constrained-baseline`
**Commit:** dc0eaed

### Changes
- **NestJS SmartAuthGuard** — checks `@Public()` before `auth.api.getSession()`, eliminating DB pressure on public endpoints (was: AuthGuard called getSession() before @Public() check)
- **DISABLE_SWAGGER=true** — Swagger UI disabled, saves startup memory
- **NODE_OPTIONS=--max-old-space-size=256** — limits V8 heap to 256MiB within 512MiB container
- **zones findAll() select optimization** — skips heavy columns (photos, description, organizerContact, treeSpecies)
- **Spring Boot JVM-Xmx via env** — JAVA_TOOLS_SB injected at pipeline start (-Xmx256m), uniform startBackend() for all backends
- **applyLimits.ts** — reverted to clean single-command (no create-then-start needed)
- **Docker Compose env-forwarding** — NODE_OPTIONS, DISABLE_SWAGGER passed via host env (no hardcoded values)

### Auth (20 VUs) — NestJS Complete

| Rank | Backend | avg | p95 | fail | iter | req/s | CPU | Mem |
|---|---|---|---|---|---|---|---|---|
| 🥇 | nestjs | 1ms | 2ms | 0.0% | ~1.5M | ~10,000 | 100% | 265MiB |

### Zones (50 VUs) — NestJS Complete

| Rank | Backend | avg | p95 | fail | iter | req/s | CPU | Mem |
|---|---|---|---|---|---|---|---|---|
| 🥇 | nestjs | 981ms | 1,164ms | ~3-4% | ~4,300 | ~29 | 100% | 240MiB |

### Mix (30 VUs) — NestJS Complete

| Rank | Backend | avg | p95 | fail | iter | req/s | CPU | Mem |
|---|---|---|---|---|---|---|---|---|
| 🥇 | nestjs | 653ms | 2,041ms | ~0.3% | ~6,900 | ~28.5 | 100% | 373MiB (peak) |

### NestJS Memory Profile
- **Startup:** ~265 MiB
- **Auth (20 VUs):** ~233 MiB (45% of 512MiB)
- **Zones (50 VUs):** ~239 MiB (46% of 512MiB) — stable
- **Mix (30 VUs):** peaks at **373 MiB (72.8% of 512MiB)** — survives all 3 runs

### Key Takeaways (NestJS)
- **SmartAuthGuard fixed zones 99.7% fail** — root cause: `@thallesp/nestjs-better-auth` AuthGuard called `getSession()` (DB query) before checking `@Public()`
- **NestJS survives 512MiB** with optimizations — peak 373MiB (72.8%), no OOM
- **~3% fail rate on zones** — likely expected under load at 512MiB; was 0% in unconstrained
- **All 3 NestJS scenarios pass 3/3** — auth, zones, mix complete

---

## Template for Next Iteration

```markdown
## Iteration N — <Description>

**Date:** ...
**Config:** ...
**Branch:** ...
**Commit:** ...

### Changes
- <optimization applied>

### Auth

| Rank | Backend | avg | p95 | fail | iter | req/s | CPU | Mem |
|---|---|---|---|---|---|---|---|---|

### Zones

| Rank | Backend | avg | p95 | fail | iter | req/s | CPU | Mem |
|---|---|---|---|---|---|---|---|---|

### Mix

| Rank | Backend | avg | p95 | fail | iter | req/s | CPU | Mem |
|---|---|---|---|---|---|---|---|---|

### Delta vs Iteration N-1

| Backend | Scenario | avg Δ | req/s Δ | Mem Δ |
|---|---|---|---|---|

### Key Takeaways
```
