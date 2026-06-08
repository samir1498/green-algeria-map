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
